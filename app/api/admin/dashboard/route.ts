import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'
import agentEngine from '@/lib/agents/agent-engine'
import cacheManager from '@/lib/cache/cache-manager'
import emailService from '@/lib/notifications/email-service'
import webSocketServer from '@/lib/websocket/websocket-server'

const prisma = new PrismaClient()

interface AdminDashboardData {
  overview: {
    totalUsers: number
    activeUsers: number
    totalAgents: number
    activeAgents: number
    totalTrades: number
    totalProfit: number
    systemUptime: number
    serverLoad: number
  }
  userMetrics: {
    newUsersToday: number
    newUsersThisWeek: number
    userRetentionRate: number
    averageAgentsPerUser: number
    topUsersByProfit: Array<{
      id: string
      name: string
      email: string
      totalProfit: number
      agentCount: number
    }>
  }
  agentMetrics: {
    agentsByType: Record<string, number>
    agentsByStatus: Record<string, number>
    averageSuccessRate: number
    topPerformingAgents: Array<{
      id: string
      name: string
      userId: string
      successRate: number
      totalProfit: number
      totalTrades: number
    }>
  }
  systemMetrics: {
    apiRequestsToday: number
    averageResponseTime: number
    errorRate: number
    cacheHitRate: number
    websocketConnections: number
    activeWebsockets: number
    databaseConnections: number
    memoryUsage: number
    cpuUsage: number
  }
  alerts: Array<{
    id: string
    type: 'error' | 'warning' | 'info'
    message: string
    timestamp: Date
    resolved: boolean
    severity: 'low' | 'medium' | 'high' | 'critical'
  }>
  recentActivity: Array<{
    type: 'user_registered' | 'agent_created' | 'trade_executed' | 'system_event' | 'error'
    message: string
    timestamp: Date
    userId?: string
    metadata?: Record<string, any>
  }>
}

// Admin role check
async function isAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    // In a real implementation, check user role from database
    // For now, check if user email is in admin list
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(email => email.trim())
    return adminEmails.includes(user?.email || '')
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check admin permissions
    const isUserAdmin = await isAdmin(session.user.id)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Collect all dashboard data
    const dashboardData = await collectAdminDashboardData()

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Error fetching admin dashboard data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const isUserAdmin = await isAdmin(session.user.id)
    if (!isUserAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { action, target, data } = await request.json()

    const result = await handleAdminAction(action, target, data, session.user.id)

    return NextResponse.json({
      success: true,
      action,
      target,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error handling admin action:', error)
    return NextResponse.json(
      { error: 'Failed to handle admin action' },
      { status: 500 }
    )
  }
}

async function collectAdminDashboardData(): Promise<AdminDashboardData> {
  // Collect data in parallel for better performance
  const [
    overview,
    userMetrics,
    agentMetrics,
    systemMetrics,
    alerts,
    recentActivity
  ] = await Promise.allSettled([
    collectOverviewData(),
    collectUserMetrics(),
    collectAgentMetrics(),
    collectSystemMetrics(),
    collectAlerts(),
    collectRecentActivity()
  ])

  return {
    overview: getSettledValue(overview) || getDefaultOverview(),
    userMetrics: getSettledValue(userMetrics) || getDefaultUserMetrics(),
    agentMetrics: getSettledValue(agentMetrics) || getDefaultAgentMetrics(),
    systemMetrics: getSettledValue(systemMetrics) || getDefaultSystemMetrics(),
    alerts: getSettledValue(alerts) || [],
    recentActivity: getSettledValue(recentActivity) || []
  }
}

function getSettledValue<T>(result: PromiseSettledResult<T>): T | null {
  return result.status === 'fulfilled' ? result.value : null
}

async function collectOverviewData() {
  const [
    totalUsers,
    totalAgents,
    activeAgents,
    engineStatus
  ] = await Promise.all([
    prisma.user.count(),
    prisma.agent.count(),
    prisma.agent.count({ where: { status: 'ACTIVE' } }),
    Promise.resolve(agentEngine.getEngineStatus())
  ])

  // Calculate active users (users with at least one active agent or recent activity)
  const activeUsers = await prisma.user.count({
    where: {
      agents: {
        some: {
          status: 'ACTIVE'
        }
      }
    }
  })

  // Mock trade and profit data (in real implementation, calculate from trades table)
  const totalTrades = engineStatus.totalExecutions || Math.floor(Math.random() * 10000)
  const totalProfit = (Math.random() - 0.3) * 50000 // Random profit/loss

  return {
    totalUsers,
    activeUsers,
    totalAgents,
    activeAgents,
    totalTrades,
    totalProfit,
    systemUptime: process.uptime(),
    serverLoad: await getServerLoad()
  }
}

async function collectUserMetrics() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    newUsersToday,
    newUsersThisWeek,
    totalUsers,
    totalAgents
  ] = await Promise.all([
    prisma.user.count({
      where: {
        createdAt: {
          gte: todayStart
        }
      }
    }),
    prisma.user.count({
      where: {
        createdAt: {
          gte: weekStart
        }
      }
    }),
    prisma.user.count(),
    prisma.agent.count()
  ])

  // Calculate user retention (simplified)
  const userRetentionRate = totalUsers > 0 ? (newUsersThisWeek / totalUsers) * 100 : 0
  const averageAgentsPerUser = totalUsers > 0 ? totalAgents / totalUsers : 0

  // Get top users by profit (mock data)
  const topUsersByProfit = await getTopUsersByProfit()

  return {
    newUsersToday,
    newUsersThisWeek,
    userRetentionRate,
    averageAgentsPerUser,
    topUsersByProfit
  }
}

async function collectAgentMetrics() {
  // Get agent distribution by type and status
  const agents = await prisma.agent.findMany({
    select: {
      id: true,
      name: true,
      userId: true,
      status: true
    }
  })

  // Group by type (using model as proxy for type)
  const agentsByType: Record<string, number> = {}
  const agentsByStatus: Record<string, number> = {}

  agents.forEach(agent => {
    // Type grouping (using default since schema has type issues)
    const type = 'trading' // Default to trading type
    agentsByType[type] = (agentsByType[type] || 0) + 1

    // Status grouping
    agentsByStatus[agent.status] = (agentsByStatus[agent.status] || 0) + 1
  })

  // Calculate average success rate (mock data)
  const averageSuccessRate = 75 + Math.random() * 20 // 75-95%

  // Get top performing agents (mock data)
  const topPerformingAgents = await getTopPerformingAgents()

  return {
    agentsByType,
    agentsByStatus,
    averageSuccessRate,
    topPerformingAgents
  }
}

async function collectSystemMetrics() {
  const cacheMetrics = cacheManager.getMetrics()
  const websocketStats = {
    connections: webSocketServer.getConnectionCount(),
    activeConnections: webSocketServer.getConnectionCount() // Same for now
  }

  return {
    apiRequestsToday: Math.floor(Math.random() * 50000), // Mock data
    averageResponseTime: cacheMetrics.hitRate > 0 ? 150 + Math.random() * 100 : 300,
    errorRate: Math.random() * 2, // 0-2%
    cacheHitRate: cacheMetrics.hitRate,
    websocketConnections: websocketStats.connections,
    activeWebsockets: websocketStats.activeConnections,
    databaseConnections: 10, // Mock data
    memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    cpuUsage: await getCpuUsage()
  }
}

async function collectAlerts() {
  const alerts = []

  // Check system health and generate alerts
  const cacheMetrics = cacheManager.getMetrics()
  const memoryUsage = process.memoryUsage()
  const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

  // Memory alert
  if (memoryPercent > 80) {
    alerts.push({
      id: `memory_${Date.now()}`,
      type: 'warning' as const,
      message: `High memory usage: ${memoryPercent.toFixed(1)}%`,
      timestamp: new Date(),
      resolved: false,
      severity: memoryPercent > 90 ? 'critical' as const : 'high' as const
    })
  }

  // Cache alert
  if (cacheMetrics.hitRate < 50 && cacheMetrics.hits + cacheMetrics.misses > 100) {
    alerts.push({
      id: `cache_${Date.now()}`,
      type: 'warning' as const,
      message: `Low cache hit rate: ${cacheMetrics.hitRate.toFixed(1)}%`,
      timestamp: new Date(),
      resolved: false,
      severity: 'medium' as const
    })
  }

  // Error rate alert
  if (cacheMetrics.errors > 10) {
    alerts.push({
      id: `errors_${Date.now()}`,
      type: 'error' as const,
      message: `High error count: ${cacheMetrics.errors} cache errors`,
      timestamp: new Date(),
      resolved: false,
      severity: 'high' as const
    })
  }

  return alerts
}

async function collectRecentActivity() {
  const activity = []

  // Get recent users
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, createdAt: true }
  })

  recentUsers.forEach(user => {
    activity.push({
      type: 'user_registered' as const,
      message: `New user registered: ${user.name || user.email}`,
      timestamp: user.createdAt,
      userId: user.id
    })
  })

  // Get recent agents
  const recentAgents = await prisma.agent.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, userId: true, createdAt: true }
  })

  recentAgents.forEach(agent => {
    activity.push({
      type: 'agent_created' as const,
      message: `New agent created: ${agent.name}`,
      timestamp: agent.createdAt,
      userId: agent.userId,
      metadata: { agentId: agent.id }
    })
  })

  // Add some mock trade activities
  for (let i = 0; i < 3; i++) {
    activity.push({
      type: 'trade_executed' as const,
      message: `Trade executed: BUY BTCUSDT at $${(45000 + Math.random() * 5000).toFixed(2)}`,
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      metadata: {
        symbol: 'BTCUSDT',
        action: 'BUY',
        profit: (Math.random() - 0.3) * 500
      }
    })
  }

  return activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

async function handleAdminAction(action: string, target: string, data: any, adminUserId: string): Promise<any> {
  console.log(`🔧 Admin action: ${action} on ${target} by ${adminUserId}`)

  switch (action) {
    case 'restart_agent_engine':
      return await restartAgentEngine()
    
    case 'flush_cache':
      return await flushSystemCache()
    
    case 'send_system_notification':
      return await sendSystemNotification(data)
    
    case 'update_user_status':
      return await updateUserStatus(target, data.status)
    
    case 'stop_agent':
      return await stopAgentAdmin(target)
    
    case 'start_agent':
      return await startAgentAdmin(target)
    
    case 'export_data':
      return await exportData(data.type, data.filters)
    
    case 'system_maintenance':
      return await toggleMaintenanceMode(data.enabled)
    
    default:
      throw new Error(`Unknown admin action: ${action}`)
  }
}

async function restartAgentEngine(): Promise<any> {
  try {
    // Stop all agents
    const agents = agentEngine.getAllAgents()
    for (const agent of agents) {
      agentEngine.stopAgent(agent.id)
    }

         // Wait a moment
     await new Promise(resolve => setTimeout(resolve, 1000))

    // Reload active agents from database
    const activeAgents = await prisma.agent.findMany({
      where: { status: 'ACTIVE' }
    })

    let restarted = 0
    for (const agent of activeAgents) {
      try {
        agentEngine.createAgent({
          id: agent.id,
          userId: agent.userId,
          name: agent.name,
          type: 'trading',
          isActive: true
        } as any)
        restarted++
      } catch (error) {
        console.error(`Failed to restart agent ${agent.id}:`, error)
      }
    }

    return {
      stopped_agents: agents.length,
      restarted_agents: restarted,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Failed to restart agent engine: ${error}`)
  }
}

async function flushSystemCache(): Promise<any> {
  try {
    const cacheMetrics = cacheManager.getMetrics()
    const success = await cacheManager.flushAll()
    
    if (!success) {
      throw new Error('Cache flush failed')
    }

    return {
      flushed_keys: cacheMetrics.totalKeys,
      cache_hit_rate_before: cacheMetrics.hitRate,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Failed to flush cache: ${error}`)
  }
}

async function sendSystemNotification(data: any): Promise<any> {
  try {
    const { title, message, severity, target_users } = data

    let userIds: string[] = []
    
    if (target_users === 'all') {
      const users = await prisma.user.findMany({ select: { id: true } })
      userIds = users.map(u => u.id)
    } else if (Array.isArray(target_users)) {
      userIds = target_users
    } else {
      userIds = [target_users]
    }

    let sent = 0
    let failed = 0

    for (const userId of userIds) {
      try {
        if (severity === 'critical' || severity === 'high') {
          await emailService.sendCriticalAlert(userId, title, message)
        } else {
          await emailService.sendNotification({
            userId,
            type: 'system_update',
            subject: title,
            data: { title, message, version: 'Admin Notification', features: [] },
            priority: severity || 'normal'
          })
        }
        sent++
      } catch (error) {
        failed++
        console.error(`Failed to send notification to user ${userId}:`, error)
      }
    }

    return {
      total_users: userIds.length,
      sent,
      failed,
      title,
      severity: severity || 'normal'
    }
  } catch (error) {
    throw new Error(`Failed to send system notification: ${error}`)
  }
}

async function updateUserStatus(userId: string, status: string): Promise<any> {
  try {
    // In a real implementation, update user status in database
    // For now, just return success
    return {
      user_id: userId,
      old_status: 'active',
      new_status: status,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Failed to update user status: ${error}`)
  }
}

async function stopAgentAdmin(agentId: string): Promise<any> {
     try {
     agentEngine.stopAgent(agentId)

     return {
       agent_id: agentId,
       action: 'stopped',
       timestamp: new Date().toISOString()
     }
  } catch (error) {
    throw new Error(`Failed to stop agent: ${error}`)
  }
}

async function startAgentAdmin(agentId: string): Promise<any> {
  try {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } })
    if (!agent) {
      throw new Error('Agent not found')
    }

    agentEngine.createAgent({
      id: agent.id,
      userId: agent.userId,
      name: agent.name,
      type: 'trading',
      isActive: true
    } as any)

         // Agent status will be managed by the agent engine

    return {
      agent_id: agentId,
      action: 'started',
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    throw new Error(`Failed to start agent: ${error}`)
  }
}

async function exportData(type: string, filters: any): Promise<any> {
  try {
    let data: any[] = []
    
    switch (type) {
      case 'users':
        data = await prisma.user.findMany({
          select: {
            id: true,
            email: true,
            name: true,
            createdAt: true,
            _count: { select: { agents: true } }
          }
        })
        break
      
      case 'agents':
        data = await prisma.agent.findMany({
          select: {
            id: true,
            name: true,
            userId: true,
            status: true,
            createdAt: true
          }
        })
        break
      
      default:
        throw new Error(`Unknown export type: ${type}`)
    }

    return {
      type,
      record_count: data.length,
      export_id: `export_${Date.now()}`,
      timestamp: new Date().toISOString(),
      data: data.slice(0, 1000) // Limit to 1000 records for API response
    }
  } catch (error) {
    throw new Error(`Failed to export data: ${error}`)
  }
}

async function toggleMaintenanceMode(enabled: boolean): Promise<any> {
  try {
    // In a real implementation, this would set a global maintenance flag
    // For now, just return the action
    return {
      maintenance_mode: enabled,
      timestamp: new Date().toISOString(),
      message: enabled ? 'Maintenance mode enabled' : 'Maintenance mode disabled'
    }
  } catch (error) {
    throw new Error(`Failed to toggle maintenance mode: ${error}`)
  }
}

// Helper functions
async function getServerLoad(): Promise<number> {
  // Simplified server load calculation
  const memoryUsage = process.memoryUsage()
  return (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
}

async function getCpuUsage(): Promise<number> {
  // Simplified CPU usage (would use os.loadavg() in real implementation)
  return Math.random() * 50 + 25 // 25-75%
}

async function getTopUsersByProfit(): Promise<any[]> {
  // Mock data - in real implementation, calculate from trades
  return [
    { id: 'user1', name: 'John Doe', email: 'john@example.com', totalProfit: 2450.30, agentCount: 3 },
    { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', totalProfit: 1890.75, agentCount: 2 },
    { id: 'user3', name: 'Bob Johnson', email: 'bob@example.com', totalProfit: 1654.20, agentCount: 4 }
  ]
}

async function getTopPerformingAgents(): Promise<any[]> {
  // Mock data - in real implementation, calculate from metrics
  return [
    { id: 'agent1', name: 'Alpha Trader', userId: 'user1', successRate: 87.5, totalProfit: 1250.50, totalTrades: 156 },
    { id: 'agent2', name: 'Beta Bot', userId: 'user2', successRate: 82.3, totalProfit: 980.25, totalTrades: 134 },
    { id: 'agent3', name: 'Gamma Grid', userId: 'user3', successRate: 79.8, totalProfit: 845.75, totalTrades: 201 }
  ]
}

// Default data functions
function getDefaultOverview() {
  return {
    totalUsers: 0,
    activeUsers: 0,
    totalAgents: 0,
    activeAgents: 0,
    totalTrades: 0,
    totalProfit: 0,
    systemUptime: 0,
    serverLoad: 0
  }
}

function getDefaultUserMetrics() {
  return {
    newUsersToday: 0,
    newUsersThisWeek: 0,
    userRetentionRate: 0,
    averageAgentsPerUser: 0,
    topUsersByProfit: []
  }
}

function getDefaultAgentMetrics() {
  return {
    agentsByType: {},
    agentsByStatus: {},
    averageSuccessRate: 0,
    topPerformingAgents: []
  }
}

function getDefaultSystemMetrics() {
  return {
    apiRequestsToday: 0,
    averageResponseTime: 0,
    errorRate: 0,
    cacheHitRate: 0,
    websocketConnections: 0,
    activeWebsockets: 0,
    databaseConnections: 0,
    memoryUsage: 0,
    cpuUsage: 0
  }
}