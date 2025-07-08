import { Server as SocketIOServer } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import agentEngine from '@/lib/agents/agent-engine'

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
    // Extract session from socket handshake
    const cookies = socket.handshake.headers.cookie
    if (!cookies) return null

    // Parse session cookie and validate
    // This is a simplified version - in production, properly parse and validate session
    try {
      // In a real implementation, you'd validate the session cookie properly
      // For now, we'll skip authentication in development
      if (process.env.NODE_ENV === 'development') {
        return { user: { id: 'dev-user', email: 'dev@example.com' } }
      }
      
      return null
    } catch (error) {
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