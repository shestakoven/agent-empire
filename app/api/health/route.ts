import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import agentEngine from '@/lib/agents/agent-engine'
import os from 'os'

const prisma = new PrismaClient()

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical'
  timestamp: Date
  uptime: number
  version: string
  environment: string
  components: {
    database: ComponentHealth
    agentEngine: ComponentHealth
    memoryUsage: ComponentHealth
    cpuUsage: ComponentHealth
    diskUsage: ComponentHealth
  }
  metrics: {
    totalUsers: number
    totalAgents: number
    activeAgents: number
    totalTrades: number
    successfulTrades: number
    totalProfit: number
    avgResponseTime: number
    errorRate: number
  }
  recentActivity: ActivityItem[]
  alerts: Alert[]
}

interface ComponentHealth {
  status: 'healthy' | 'degraded' | 'critical'
  message: string
  metrics?: Record<string, any>
  lastChecked: Date
  responseTime?: number
}

interface ActivityItem {
  type: 'agent_created' | 'trade_executed' | 'error' | 'system_event'
  message: string
  timestamp: Date
  severity: 'info' | 'warning' | 'error'
  metadata?: Record<string, any>
}

interface Alert {
  id: string
  type: 'performance' | 'error' | 'security' | 'capacity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  resolved: boolean
}

// In-memory storage for metrics (use Redis in production)
const healthMetrics = {
  responseTimes: [] as number[],
  errorCount: 0,
  requestCount: 0,
  lastReset: Date.now(),
  alerts: [] as Alert[]
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Collect all health information
    const systemHealth = await collectSystemHealth()
    
    // Record response time
    const responseTime = Date.now() - startTime
    recordResponseTime(responseTime)
    
    return NextResponse.json(systemHealth, {
      headers: {
        'Cache-Control': 'no-cache, must-revalidate',
        'X-Health-Check': 'true',
        'X-Response-Time': responseTime.toString()
      }
    })
    
  } catch (error) {
    console.error('Health check failed:', error)
    recordError()
    
    return NextResponse.json({
      status: 'critical',
      error: 'Health check failed',
      timestamp: new Date()
    }, { 
      status: 500,
      headers: {
        'X-Health-Check': 'failed'
      }
    })
  }
}

async function collectSystemHealth(): Promise<SystemHealth> {
  const startTime = Date.now()
  
  // Check all components in parallel
  const [
    databaseHealth,
    agentEngineHealth,
    memoryHealth,
    cpuHealth,
    diskHealth,
    metrics,
    recentActivity
  ] = await Promise.allSettled([
    checkDatabaseHealth(),
    checkAgentEngineHealth(),
    checkMemoryHealth(),
    checkCpuHealth(),
    checkDiskHealth(),
    collectMetrics(),
    getRecentActivity()
  ])

  // Determine overall system status
  const components = {
    database: getResult(databaseHealth),
    agentEngine: getResult(agentEngineHealth),
    memoryUsage: getResult(memoryHealth),
    cpuUsage: getResult(cpuHealth),
    diskUsage: getResult(diskHealth)
  }

  const overallStatus = determineOverallStatus(components)
  const alerts = generateAlerts(components, getResult(metrics))

  return {
    status: overallStatus,
    timestamp: new Date(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    components,
    metrics: getResult(metrics) || getDefaultMetrics(),
    recentActivity: getResult(recentActivity) || [],
    alerts
  }
}

function getResult<T>(settledResult: PromiseSettledResult<T>): T {
  if (settledResult.status === 'fulfilled') {
    return settledResult.value
  } else {
    console.error('Component check failed:', settledResult.reason)
    throw settledResult.reason
  }
}

async function checkDatabaseHealth(): Promise<ComponentHealth> {
  const startTime = Date.now()
  
  try {
    // Test database connection with a simple query
    await prisma.$queryRaw`SELECT 1`
    
    // Check database performance
    const userCount = await prisma.user.count()
    const agentCount = await prisma.agent.count()
    
    const responseTime = Date.now() - startTime
    
    return {
      status: responseTime < 100 ? 'healthy' : responseTime < 500 ? 'degraded' : 'critical',
      message: `Database responding in ${responseTime}ms`,
      metrics: {
        responseTime,
        userCount,
        agentCount,
        connectionPool: 'healthy' // Would check actual pool status in production
      },
      lastChecked: new Date(),
      responseTime
    }
  } catch (error) {
    return {
      status: 'critical',
      message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date(),
      responseTime: Date.now() - startTime
    }
  }
}

async function checkAgentEngineHealth(): Promise<ComponentHealth> {
  const startTime = Date.now()
  
  try {
    const status = agentEngine.getEngineStatus()
    const responseTime = Date.now() - startTime
    
    const isHealthy = status.isRunning && status.totalAgents >= 0
    const isDegraded = status.runningAgents < status.totalAgents * 0.8 // Less than 80% running
    
    return {
      status: isHealthy ? (isDegraded ? 'degraded' : 'healthy') : 'critical',
      message: `Agent engine ${status.isRunning ? 'running' : 'stopped'}, ${status.runningAgents}/${status.totalAgents} agents active`,
      metrics: {
        isRunning: status.isRunning,
        totalAgents: status.totalAgents,
        runningAgents: status.runningAgents,
        totalExecutions: status.totalExecutions,
        uptime: status.uptime
      },
      lastChecked: new Date(),
      responseTime
    }
  } catch (error) {
    return {
      status: 'critical',
      message: `Agent engine check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      lastChecked: new Date(),
      responseTime: Date.now() - startTime
    }
  }
}

async function checkMemoryHealth(): Promise<ComponentHealth> {
  const memoryUsage = process.memoryUsage()
  const totalMemory = os.totalmem()
  const freeMemory = os.freemem()
  const usedMemory = totalMemory - freeMemory
  const memoryUtilization = (usedMemory / totalMemory) * 100
  
  const heapUtilization = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
  
  let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
  if (memoryUtilization > 90 || heapUtilization > 90) {
    status = 'critical'
  } else if (memoryUtilization > 80 || heapUtilization > 80) {
    status = 'degraded'
  }
  
  return {
    status,
    message: `Memory utilization: ${memoryUtilization.toFixed(1)}%, Heap: ${heapUtilization.toFixed(1)}%`,
    metrics: {
      totalMemory: Math.round(totalMemory / 1024 / 1024), // MB
      usedMemory: Math.round(usedMemory / 1024 / 1024),
      freeMemory: Math.round(freeMemory / 1024 / 1024),
      memoryUtilization: Math.round(memoryUtilization),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      heapUtilization: Math.round(heapUtilization)
    },
    lastChecked: new Date()
  }
}

async function checkCpuHealth(): Promise<ComponentHealth> {
  const cpus = os.cpus()
  const loadAverage = os.loadavg()
  const cpuCount = cpus.length
  
  // Calculate CPU utilization (simplified)
  const loadPercentage = (loadAverage[0] / cpuCount) * 100
  
  let status: 'healthy' | 'degraded' | 'critical' = 'healthy'
  if (loadPercentage > 90) {
    status = 'critical'
  } else if (loadPercentage > 70) {
    status = 'degraded'
  }
  
  return {
    status,
    message: `CPU load: ${loadPercentage.toFixed(1)}% (${loadAverage[0].toFixed(2)}/${cpuCount})`,
    metrics: {
      cpuCount,
      loadAverage: loadAverage.map(load => Math.round(load * 100) / 100),
      loadPercentage: Math.round(loadPercentage),
      model: cpus[0]?.model || 'Unknown'
    },
    lastChecked: new Date()
  }
}

async function checkDiskHealth(): Promise<ComponentHealth> {
  // Note: Getting disk usage in Node.js requires platform-specific commands
  // This is a simplified version - in production, use proper disk monitoring
  
  return {
    status: 'healthy',
    message: 'Disk usage monitoring not implemented',
    metrics: {
      available: 'unknown',
      used: 'unknown',
      total: 'unknown'
    },
    lastChecked: new Date()
  }
}

async function collectMetrics(): Promise<SystemHealth['metrics']> {
  try {
    // Database metrics
    const totalUsers = await prisma.user.count()
    const totalAgents = await prisma.agent.count()
    
    // Agent engine metrics
    const engineStatus = agentEngine.getEngineStatus()
    const activeAgents = engineStatus.runningAgents
    
    // Calculate success rate and profit (simplified)
    const agents = agentEngine.getAllAgents()
    let totalTrades = 0
    let successfulTrades = 0
    let totalProfit = 0
    
    for (const agent of agents) {
      const metrics = agentEngine.getAgentMetrics(agent.id)
      if (metrics) {
        totalTrades += metrics.totalExecutions
        successfulTrades += metrics.successfulExecutions
        totalProfit += metrics.totalProfit
      }
    }
    
    // Performance metrics
    const avgResponseTime = calculateAverageResponseTime()
    const errorRate = calculateErrorRate()
    
    return {
      totalUsers,
      totalAgents,
      activeAgents,
      totalTrades,
      successfulTrades,
      totalProfit: Math.round(totalProfit * 100) / 100,
      avgResponseTime,
      errorRate
    }
  } catch (error) {
    console.error('Error collecting metrics:', error)
    return getDefaultMetrics()
  }
}

function getDefaultMetrics(): SystemHealth['metrics'] {
  return {
    totalUsers: 0,
    totalAgents: 0,
    activeAgents: 0,
    totalTrades: 0,
    successfulTrades: 0,
    totalProfit: 0,
    avgResponseTime: 0,
    errorRate: 0
  }
}

async function getRecentActivity(): Promise<ActivityItem[]> {
  const activity: ActivityItem[] = []
  
  try {
    // Get recent agents created (last 24 hours)
    const recentAgents = await prisma.agent.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })
    
    for (const agent of recentAgents) {
      activity.push({
        type: 'agent_created',
        message: `Agent "${agent.name}" created`,
        timestamp: agent.createdAt,
        severity: 'info',
        metadata: {
          agentId: agent.id
        }
      })
    }
    
    // Add system events
    activity.push({
      type: 'system_event',
      message: 'Health check completed',
      timestamp: new Date(),
      severity: 'info'
    })
    
    return activity.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  } catch (error) {
    return [{
      type: 'error',
      message: 'Failed to load recent activity',
      timestamp: new Date(),
      severity: 'error'
    }]
  }
}

function determineOverallStatus(components: SystemHealth['components']): 'healthy' | 'degraded' | 'critical' {
  const statuses = Object.values(components).map(component => component.status)
  
  if (statuses.includes('critical')) {
    return 'critical'
  } else if (statuses.includes('degraded')) {
    return 'degraded'
  } else {
    return 'healthy'
  }
}

function generateAlerts(components: SystemHealth['components'], metrics: SystemHealth['metrics']): Alert[] {
  const alerts: Alert[] = []
  
  // Check for critical components
  Object.entries(components).forEach(([componentName, health]) => {
    if (health.status === 'critical') {
      alerts.push({
        id: `${componentName}_critical_${Date.now()}`,
        type: 'performance',
        severity: 'critical',
        message: `${componentName} is in critical state: ${health.message}`,
        timestamp: new Date(),
        resolved: false
      })
    }
  })
  
  // Check error rate
  if (metrics.errorRate > 5) {
    alerts.push({
      id: `error_rate_high_${Date.now()}`,
      type: 'error',
      severity: metrics.errorRate > 10 ? 'high' : 'medium',
      message: `High error rate: ${metrics.errorRate.toFixed(1)}%`,
      timestamp: new Date(),
      resolved: false
    })
  }
  
  // Check response time
  if (metrics.avgResponseTime > 1000) {
    alerts.push({
      id: `response_time_high_${Date.now()}`,
      type: 'performance',
      severity: metrics.avgResponseTime > 2000 ? 'high' : 'medium',
      message: `High average response time: ${metrics.avgResponseTime}ms`,
      timestamp: new Date(),
      resolved: false
    })
  }
  
  return alerts
}

function recordResponseTime(responseTime: number) {
  healthMetrics.responseTimes.push(responseTime)
  healthMetrics.requestCount++
  
  // Keep only last 100 response times
  if (healthMetrics.responseTimes.length > 100) {
    healthMetrics.responseTimes = healthMetrics.responseTimes.slice(-100)
  }
}

function recordError() {
  healthMetrics.errorCount++
}

function calculateAverageResponseTime(): number {
  if (healthMetrics.responseTimes.length === 0) return 0
  
  const sum = healthMetrics.responseTimes.reduce((acc, time) => acc + time, 0)
  return Math.round(sum / healthMetrics.responseTimes.length)
}

function calculateErrorRate(): number {
  if (healthMetrics.requestCount === 0) return 0
  
  return Math.round((healthMetrics.errorCount / healthMetrics.requestCount) * 100 * 100) / 100
}

// Reset metrics periodically (every hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000
  if (healthMetrics.lastReset < oneHourAgo) {
    healthMetrics.errorCount = 0
    healthMetrics.requestCount = 0
    healthMetrics.responseTimes = []
    healthMetrics.lastReset = Date.now()
  }
}, 60 * 60 * 1000) // Every hour