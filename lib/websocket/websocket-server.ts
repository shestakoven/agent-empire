import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import agentEngine from '@/lib/agents/agent-engine'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'

const prisma = new PrismaClient()

export interface SocketUser {
  userId: string
  sessionId: string
  connectedAt: Date
  lastSeen: Date
}

export interface WebSocketMessage {
  type: 'agent_execution' | 'trade_update' | 'system_status' | 'portfolio_update' | 'error'
  data: any
  timestamp: Date
  userId?: string
  agentId?: string
}

class WebSocketServer {
  private io: SocketIOServer | null = null
  private connectedUsers = new Map<string, SocketUser>()
  private userSockets = new Map<string, Set<string>>() // userId -> Set of socketIds
  private heartbeatInterval: NodeJS.Timeout | null = null

  async initialize(server: any) {
    try {
      this.io = new SocketIOServer(server, {
        cors: {
          origin: process.env.NODE_ENV === 'production' 
            ? [process.env.APP_URL || 'https://your-domain.com']
            : ['http://localhost:3000'],
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000
      })

      // Setup Redis adapter for scaling (optional)
      if (process.env.REDIS_URL) {
        const pubClient = createClient({ url: process.env.REDIS_URL })
        const subClient = pubClient.duplicate()
        
        await Promise.all([pubClient.connect(), subClient.connect()])
        this.io.adapter(createAdapter(pubClient, subClient))
        
        console.log('✅ WebSocket server initialized with Redis adapter')
      } else {
        console.log('✅ WebSocket server initialized without Redis')
      }

      this.setupEventHandlers()
      this.startHeartbeat()
      
      console.log('🔌 WebSocket server ready for connections')
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket server:', error)
    }
  }

  private setupEventHandlers() {
    if (!this.io) return

    this.io.use(async (socket, next) => {
      try {
        // Authenticate user from session
        const session = await this.authenticateSocket(socket)
        if (!session?.user?.id) {
          return next(new Error('Authentication failed'))
        }

        socket.data.userId = session.user.id
        socket.data.user = session.user
        next()
      } catch (error) {
        next(new Error('Authentication failed'))
      }
    })

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId
      const user: SocketUser = {
        userId,
        sessionId: socket.id,
        connectedAt: new Date(),
        lastSeen: new Date()
      }

      // Track user connection
      this.connectedUsers.set(socket.id, user)
      
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set())
      }
      this.userSockets.get(userId)!.add(socket.id)

      console.log(`👤 User ${userId} connected (${socket.id})`)
      
      // Join user to their personal room
      socket.join(`user:${userId}`)
      
      // Send initial data
      this.sendInitialData(socket, userId)

      // Handle client events
      socket.on('subscribe_agent', (agentId: string) => {
        if (this.isUserAuthorized(userId, agentId)) {
          socket.join(`agent:${agentId}`)
          console.log(`📡 User ${userId} subscribed to agent ${agentId}`)
        }
      })

      socket.on('unsubscribe_agent', (agentId: string) => {
        socket.leave(`agent:${agentId}`)
        console.log(`📡 User ${userId} unsubscribed from agent ${agentId}`)
      })

      socket.on('get_agent_status', async (agentId: string) => {
        if (this.isUserAuthorized(userId, agentId)) {
          const metrics = agentEngine.getAgentMetrics(agentId)
          const history = agentEngine.getAgentExecutionHistory(agentId)
          
          socket.emit('agent_status', {
            agentId,
            metrics,
            history: history.slice(-10) // Last 10 executions
          })
        }
      })

      socket.on('get_system_status', () => {
        const status = agentEngine.getEngineStatus()
        socket.emit('system_status', status)
      })

      socket.on('ping', () => {
        const user = this.connectedUsers.get(socket.id)
        if (user) {
          user.lastSeen = new Date()
          this.connectedUsers.set(socket.id, user)
        }
        socket.emit('pong')
      })

      socket.on('disconnect', (reason) => {
        console.log(`👤 User ${userId} disconnected (${socket.id}): ${reason}`)
        
        this.connectedUsers.delete(socket.id)
        
        const userSocketSet = this.userSockets.get(userId)
        if (userSocketSet) {
          userSocketSet.delete(socket.id)
          if (userSocketSet.size === 0) {
            this.userSockets.delete(userId)
          }
        }
      })

      socket.on('error', (error) => {
        console.error(`Socket error for user ${userId}:`, error)
      })
    })
  }

  private async authenticateSocket(socket: any): Promise<any> {
    try {
      // Extract cookies from socket handshake
      const cookies = socket.handshake.headers.cookie
      if (!cookies) {
        console.log('❌ WebSocket authentication failed: No cookies found')
        return null
      }

      // Parse cookies to extract session information
      const cookieMap = this.parseCookies(cookies)
      
      // Try to get session using NextAuth
      // We need to construct a request-like object for getServerSession
      const req = {
        headers: {
          cookie: cookies
        },
        cookies: cookieMap
      }

             try {
         const session = await getServerSession(req as any, {} as any, authOptions)
         
         if (session?.user?.id) {
           console.log(`✅ WebSocket user authenticated via NextAuth: ${session.user.id}`)
           return session
         } else {
           console.log('⚠️ NextAuth session validation returned no session, trying fallback...')
         }
       } catch (sessionError) {
         console.error('⚠️ NextAuth session validation failed, trying fallback:', sessionError)
       }

       // Fallback: Try to extract and validate session token manually
       const sessionToken = cookieMap['next-auth.session-token'] || 
                          cookieMap['__Secure-next-auth.session-token'] ||
                          cookieMap['next-auth.session-token.0'] ||
                          cookieMap['__Host-next-auth.session-token']

       if (sessionToken) {
         console.log('🔍 Attempting manual session token validation...')
         const fallbackSession = await this.validateSessionToken(sessionToken)
         
         if (fallbackSession?.user?.id) {
           console.log(`✅ WebSocket user authenticated via fallback: ${fallbackSession.user.id}`)
           return fallbackSession
         }
       }

       // Final fallback: Check for JWT token in case NextAuth is configured for JWT
       const jwtToken = cookieMap['next-auth.session-token'] || cookieMap['__Secure-next-auth.session-token']
       if (jwtToken && process.env.NEXTAUTH_SECRET) {
         try {
           const verified = jwt.verify(jwtToken, process.env.NEXTAUTH_SECRET) as any
           if (verified?.sub) {
             console.log('✅ WebSocket user authenticated via JWT verification')
             const user = await prisma.user.findUnique({
               where: { id: verified.sub }
             })
             
             if (user) {
               return {
                 user: {
                   id: user.id,
                   email: user.email,
                   name: user.name,
                   image: user.image
                 }
               }
             }
           }
         } catch (jwtError) {
           console.error('JWT verification failed:', jwtError)
         }
       }

       console.log('❌ All WebSocket authentication methods failed')
       return null
    } catch (error) {
      console.error('❌ WebSocket authentication error:', error)
      return null
    }
  }

  private parseCookies(cookieString: string): Record<string, string> {
    const cookies: Record<string, string> = {}
    
    cookieString.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=')
      if (name && value) {
        cookies[name] = decodeURIComponent(value)
      }
    })
    
    return cookies
  }

  private async validateSessionToken(sessionToken: string): Promise<any> {
    try {
      if (!sessionToken || sessionToken.length < 10) {
        return null
      }

      // Try to find session in database (NextAuth stores sessions in the database)
      try {
        // Query the session from the database
        const session = await prisma.session.findUnique({
          where: {
            sessionToken: sessionToken
          },
          include: {
            user: true
          }
        })

        if (!session) {
          console.log('❌ WebSocket session not found in database')
          return null
        }

        // Check if session is expired
        if (session.expires < new Date()) {
          console.log('❌ WebSocket session expired')
          return null
        }

        // Return session in NextAuth format
        return {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            image: session.user.image
          },
          expires: session.expires.toISOString()
        }

      } catch (dbError) {
        console.error('❌ Database session lookup failed:', dbError)
        
        // Fallback for development: Try to decode JWT if it's a JWT token
        if (process.env.NODE_ENV === 'development') {
          try {
            // Some NextAuth configurations use JWT tokens instead of database sessions
            const decoded = jwt.decode(sessionToken) as any
            
            if (decoded && decoded.sub) {
              console.log('⚠️ Development fallback: Using JWT session token')
              
              // Look up user by ID from JWT
              const user = await prisma.user.findUnique({
                where: { id: decoded.sub }
              })
              
              if (user) {
                return {
                  user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image
                  }
                }
              }
            }
          } catch (jwtError) {
            console.error('JWT decode failed:', jwtError)
          }
        }
        
        return null
      }
      
    } catch (error) {
      console.error('❌ Session token validation error:', error)
      return null
    }
  }

  private async sendInitialData(socket: any, userId: string) {
    try {
      // Send agent engine status
      const engineStatus = agentEngine.getEngineStatus()
      socket.emit('system_status', engineStatus)

      // Send user's agents
      const userAgents = agentEngine.getAllAgents().filter(agent => agent.userId === userId)
      socket.emit('user_agents', userAgents.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        isActive: agent.isActive,
        metrics: agentEngine.getAgentMetrics(agent.id)
      })))

      // Send recent activity
      const recentActivity = this.getRecentActivity(userId)
      socket.emit('recent_activity', recentActivity)
      
    } catch (error) {
      console.error('Error sending initial data:', error)
    }
  }

  private isUserAuthorized(userId: string, agentId: string): boolean {
    const agents = agentEngine.getAllAgents()
    const agent = agents.find(a => a.id === agentId)
    return agent?.userId === userId
  }

  private getRecentActivity(userId: string): any[] {
    // Get recent activity for user's agents
    const userAgents = agentEngine.getAllAgents().filter(agent => agent.userId === userId)
    const recentActivity: any[] = []

    for (const agent of userAgents) {
      const history = agentEngine.getAgentExecutionHistory(agent.id)
      const recent = history.slice(-5).map(execution => ({
        agentId: agent.id,
        agentName: agent.name,
        type: execution.decision.type,
        action: execution.decision.action,
        outcome: execution.outcome,
        profit: execution.profit,
        timestamp: execution.timestamp
      }))
      recentActivity.push(...recent)
    }

    return recentActivity
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now()
      const timeout = 5 * 60 * 1000 // 5 minutes

      // Clean up stale connections
      for (const [socketId, user] of Array.from(this.connectedUsers.entries())) {
        if (now - user.lastSeen.getTime() > timeout) {
          console.log(`🧹 Cleaning up stale connection for user ${user.userId}`)
          this.connectedUsers.delete(socketId)
          
          const userSocketSet = this.userSockets.get(user.userId)
          if (userSocketSet) {
            userSocketSet.delete(socketId)
            if (userSocketSet.size === 0) {
              this.userSockets.delete(user.userId)
            }
          }
        }
      }

      // Send system status to all connected clients
      const status = agentEngine.getEngineStatus()
      this.broadcast('system_status', status)
      
    }, 60000) // Every minute
  }

  // Public methods for broadcasting messages
  broadcast(type: string, data: any, room?: string) {
    if (!this.io) return

    const message: WebSocketMessage = {
      type: type as any,
      data,
      timestamp: new Date()
    }

    if (room) {
      this.io.to(room).emit(type, message)
    } else {
      this.io.emit(type, message)
    }
  }

  sendToUser(userId: string, type: string, data: any) {
    if (!this.io) return

    const message: WebSocketMessage = {
      type: type as any,
      data,
      timestamp: new Date(),
      userId
    }

    this.io.to(`user:${userId}`).emit(type, message)
  }

  sendToAgent(agentId: string, type: string, data: any) {
    if (!this.io) return

    const message: WebSocketMessage = {
      type: type as any,
      data,
      timestamp: new Date(),
      agentId
    }

    this.io.to(`agent:${agentId}`).emit(type, message)
  }

  notifyAgentExecution(agentId: string, execution: any) {
    const agent = agentEngine.getAllAgents().find(a => a.id === agentId)
    if (!agent) return

    // Send to agent subscribers
    this.sendToAgent(agentId, 'agent_execution', {
      agentId,
      agentName: agent.name,
      execution
    })

    // Send to agent owner
    this.sendToUser(agent.userId, 'agent_execution', {
      agentId,
      agentName: agent.name,
      execution
    })
  }

  notifyTradeUpdate(agentId: string, trade: any) {
    const agent = agentEngine.getAllAgents().find(a => a.id === agentId)
    if (!agent) return

    this.sendToUser(agent.userId, 'trade_update', {
      agentId,
      agentName: agent.name,
      trade
    })
  }

  notifyPortfolioUpdate(userId: string, portfolio: any) {
    this.sendToUser(userId, 'portfolio_update', portfolio)
  }

  notifyError(userId: string, error: any) {
    this.sendToUser(userId, 'error', error)
  }

  getConnectedUsers(): SocketUser[] {
    return Array.from(this.connectedUsers.values())
  }

  getConnectionCount(): number {
    return this.connectedUsers.size
  }

  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0
  }

  isUserConnected(userId: string): boolean {
    return this.userSockets.has(userId)
  }

  async testAuthentication(cookies: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      const mockSocket = {
        handshake: {
          headers: {
            cookie: cookies
          }
        }
      }

      const session = await this.authenticateSocket(mockSocket)
      
      if (session?.user?.id) {
        return {
          success: true,
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name
          }
        }
      } else {
        return {
          success: false,
          error: 'Authentication failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  getAuthenticationStatus(): {
    nextAuthConfigured: boolean
    databaseConnected: boolean
    jwtSecretConfigured: boolean
    connectedUsers: number
  } {
    return {
      nextAuthConfigured: !!authOptions,
      databaseConnected: true, // We assume Prisma is connected
      jwtSecretConfigured: !!process.env.NEXTAUTH_SECRET,
      connectedUsers: this.connectedUsers.size
    }
  }

  cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    if (this.io) {
      this.io.close()
    }
  }
}

// Singleton instance
const webSocketServer = new WebSocketServer()

export default webSocketServer
export { WebSocketServer }