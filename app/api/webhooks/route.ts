import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import emailService from '@/lib/notifications/email-service'
import cacheManager from '@/lib/cache/cache-manager'
import agentEngine from '@/lib/agents/agent-engine'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

interface WebhookPayload {
  type: 'trade_executed' | 'agent_status_changed' | 'market_alert' | 'system_notification' | 'user_action'
  data: Record<string, any>
  source: string
  timestamp: string
  signature?: string
}

interface WebhookResponse {
  success: boolean
  message: string
  data?: any
  processed_at: string
}

// Rate limiting store for webhooks
const webhookRateLimit = new Map<string, { count: number; resetTime: number }>()

export async function POST(request: NextRequest) {
  try {
    // Get user session for authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse webhook payload
    const payload: WebhookPayload = await request.json()
    
    // Validate webhook payload
    const validation = validateWebhookPayload(payload)
    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, message: validation.error },
        { status: 400 }
      )
    }

    // Check rate limits
    const clientIP = getClientIP(request)
    const rateLimitResult = checkWebhookRateLimit(clientIP)
    if (rateLimitResult.blocked) {
      return NextResponse.json(
        { success: false, message: 'Rate limit exceeded' },
        { status: 429 }
      )
    }

    // Verify webhook signature if provided
    if (payload.signature) {
      const isValidSignature = verifyWebhookSignature(payload, request)
      if (!isValidSignature) {
        return NextResponse.json(
          { success: false, message: 'Invalid webhook signature' },
          { status: 401 }
        )
      }
    }

    // Process webhook based on type
    const result = await processWebhook(payload, session.user.id)
    
    // Cache webhook for audit trail
    await cacheWebhookEvent(payload, session.user.id, result)

    const response: WebhookResponse = {
      success: true,
      message: 'Webhook processed successfully',
      data: result,
      processed_at: new Date().toISOString()
    }

    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    console.error('Webhook processing error:', error)
    
    const errorResponse: WebhookResponse = {
      success: false,
      message: 'Internal webhook processing error',
      processed_at: new Date().toISOString()
    }

    return NextResponse.json(errorResponse, { status: 500 })
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

    // Get webhook history for user
    const history = await getWebhookHistory(session.user.id)
    
    return NextResponse.json({
      webhooks: history,
      total: history.length,
      user_id: session.user.id
    })

  } catch (error) {
    console.error('Error fetching webhook history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook history' },
      { status: 500 }
    )
  }
}

async function processWebhook(payload: WebhookPayload, userId: string): Promise<any> {
  switch (payload.type) {
    case 'trade_executed':
      return await handleTradeExecutedWebhook(payload, userId)
    
    case 'agent_status_changed':
      return await handleAgentStatusWebhook(payload, userId)
    
    case 'market_alert':
      return await handleMarketAlertWebhook(payload, userId)
    
    case 'system_notification':
      return await handleSystemNotificationWebhook(payload, userId)
    
    case 'user_action':
      return await handleUserActionWebhook(payload, userId)
    
    default:
      throw new Error(`Unknown webhook type: ${payload.type}`)
  }
}

async function handleTradeExecutedWebhook(payload: WebhookPayload, userId: string): Promise<any> {
  const { agentId, symbol, action, price, quantity, profit, timestamp } = payload.data

  try {
    // Validate agent ownership
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId }
    })

    if (!agent) {
      throw new Error('Agent not found or unauthorized')
    }

    // Log trade execution
    console.log(`🤖 Trade executed via webhook: ${agent.name} ${action} ${quantity} ${symbol} at ${price}`)

    // Send email notification
    await emailService.sendTradeAlert(userId, agent.name, {
      action,
      symbol,
      price,
      profit: profit || 0,
      confidence: 85 // Default confidence for webhook trades
    })

    // Update agent performance cache
    const currentPerformance = await cacheManager.getCachedAgentPerformance(agentId) || {
      totalTrades: 0,
      successRate: 0,
      totalProfit: 0
    }

    const updatedPerformance = {
      totalTrades: currentPerformance.totalTrades + 1,
      successRate: profit > 0 ? Math.min(100, currentPerformance.successRate + 1) : Math.max(0, currentPerformance.successRate - 1),
      totalProfit: currentPerformance.totalProfit + (profit || 0),
      lastTradeTime: new Date(),
      lastTradeSymbol: symbol,
      lastTradeAction: action
    }

    await cacheManager.cacheAgentPerformance(agentId, updatedPerformance)

    // Invalidate related caches
    await cacheManager.invalidateByTags([`agent:${agentId}`, `user:${userId}`])

    return {
      trade_logged: true,
      notification_sent: true,
      performance_updated: true,
      agent_name: agent.name
    }

  } catch (error) {
    console.error('Error handling trade executed webhook:', error)
    throw error
  }
}

async function handleAgentStatusWebhook(payload: WebhookPayload, userId: string): Promise<any> {
  const { agentId, status, reason, metadata } = payload.data

  try {
    const agent = await prisma.agent.findFirst({
      where: { id: agentId, userId }
    })

    if (!agent) {
      throw new Error('Agent not found or unauthorized')
    }

    console.log(`🤖 Agent status changed via webhook: ${agent.name} -> ${status}`)

    // Update agent status in database
    await prisma.agent.update({
      where: { id: agentId },
      data: { 
        status: status.toUpperCase(),
        updatedAt: new Date()
      }
    })

    // Handle critical status changes
    if (status === 'ERROR' || status === 'STOPPED') {
      await emailService.sendCriticalAlert(
        userId,
        'Agent Status Alert',
        `Your agent "${agent.name}" has changed status to ${status}. ${reason || ''}`,
        'Please check your agent configuration and restart if necessary.'
      )
    }

    // Update agent engine if needed
    if (status === 'STOPPED') {
      agentEngine.stopAgent(agentId)
    } else if (status === 'ACTIVE') {
      // Restart agent if possible
      const agentData = await prisma.agent.findUnique({ where: { id: agentId } })
      if (agentData) {
                 agentEngine.createAgent({
           id: agentData.id,
           userId: agentData.userId,
           name: agentData.name,
           type: 'trading' as any, // Default type since it's not stored in database
           isActive: true,
           // Add other required fields
         } as any)
      }
    }

    // Invalidate caches
    await cacheManager.invalidateByTags([`agent:${agentId}`, `user:${userId}`])

    return {
      status_updated: true,
      notification_sent: status === 'ERROR' || status === 'STOPPED',
      agent_name: agent.name,
      new_status: status
    }

  } catch (error) {
    console.error('Error handling agent status webhook:', error)
    throw error
  }
}

async function handleMarketAlertWebhook(payload: WebhookPayload, userId: string): Promise<any> {
  const { symbol, alertType, price, change, threshold, message } = payload.data

  try {
    console.log(`📈 Market alert via webhook: ${symbol} ${alertType} - ${message}`)

    // Update market data cache
    const marketData = {
      symbol,
      price,
      change24h: change,
      timestamp: new Date(),
      alertTriggered: true,
      alertType,
      threshold
    }

    await cacheManager.cacheMarketData(symbol, marketData)

    // Check if user has agents trading this symbol
    const userAgents = await prisma.agent.findMany({
      where: { 
        userId,
        status: 'ACTIVE'
      }
    })

    const affectedAgents = userAgents.filter(agent => {
      // In a real implementation, check if agent trades this symbol
      return true // For demo, assume all agents are affected
    })

    if (affectedAgents.length > 0) {
      // Send market alert notification
      await emailService.sendNotification({
        userId,
        type: 'system_update',
        subject: `Market Alert: ${symbol} ${alertType}`,
        data: {
          title: `Market Alert: ${symbol}`,
          message: `${message}. Current price: $${price}`,
          version: 'Market Alert',
          features: [
            `${symbol} triggered ${alertType} alert`,
            `Price: $${price} (${change > 0 ? '+' : ''}${change}%)`,
            `${affectedAgents.length} of your agents may be affected`
          ]
        },
        priority: 'high'
      })
    }

    return {
      market_data_updated: true,
      affected_agents: affectedAgents.length,
      notification_sent: affectedAgents.length > 0,
      symbol,
      alert_type: alertType
    }

  } catch (error) {
    console.error('Error handling market alert webhook:', error)
    throw error
  }
}

async function handleSystemNotificationWebhook(payload: WebhookPayload, userId: string): Promise<any> {
  const { title, message, severity, category, actionRequired } = payload.data

  try {
    console.log(`🔔 System notification via webhook: ${title} (${severity})`)

    if (severity === 'critical' || severity === 'high') {
      await emailService.sendCriticalAlert(
        userId,
        title,
        message,
        actionRequired
      )
    } else {
      await emailService.sendNotification({
        userId,
        type: 'system_update',
        subject: title,
        data: {
          title,
          message,
          version: 'System Notification',
          features: []
        },
        priority: severity === 'high' ? 'high' : 'normal'
      })
    }

    return {
      notification_sent: true,
      severity,
      category: category || 'general'
    }

  } catch (error) {
    console.error('Error handling system notification webhook:', error)
    throw error
  }
}

async function handleUserActionWebhook(payload: WebhookPayload, userId: string): Promise<any> {
  const { action, targetType, targetId, metadata } = payload.data

  try {
    console.log(`👤 User action via webhook: ${action} on ${targetType}:${targetId}`)

    // Handle different user actions
    switch (action) {
      case 'agent_created':
        await cacheManager.invalidateByTags([`user:${userId}`])
        break
      
      case 'agent_deleted':
        await cacheManager.invalidateByTags([`agent:${targetId}`, `user:${userId}`])
        agentEngine.removeAgent(targetId)
        break
      
      case 'settings_updated':
        await cacheManager.invalidateByTags([`user:${userId}`])
        break
      
      case 'subscription_changed':
        // Handle subscription changes
        await cacheManager.invalidateByPattern(`user:${userId}:*`)
        break
    }

    return {
      action_processed: true,
      action,
      target_type: targetType,
      target_id: targetId,
      cache_invalidated: true
    }

  } catch (error) {
    console.error('Error handling user action webhook:', error)
    throw error
  }
}

function validateWebhookPayload(payload: WebhookPayload): { isValid: boolean; error?: string } {
  if (!payload.type) {
    return { isValid: false, error: 'Missing webhook type' }
  }

  if (!payload.data) {
    return { isValid: false, error: 'Missing webhook data' }
  }

  if (!payload.source) {
    return { isValid: false, error: 'Missing webhook source' }
  }

  if (!payload.timestamp) {
    return { isValid: false, error: 'Missing webhook timestamp' }
  }

  // Validate timestamp is recent (within 5 minutes)
  const webhookTime = new Date(payload.timestamp).getTime()
  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  if (now - webhookTime > fiveMinutes) {
    return { isValid: false, error: 'Webhook timestamp too old' }
  }

  return { isValid: true }
}

function verifyWebhookSignature(payload: WebhookPayload, request: NextRequest): boolean {
  const signature = payload.signature
  const webhookSecret = process.env.WEBHOOK_SECRET

  if (!webhookSecret) {
    console.warn('No webhook secret configured, skipping signature verification')
    return true
  }

  if (!signature) {
    return false
  }

  try {
    // Create signature from payload
    const payloadString = JSON.stringify(payload.data) + payload.timestamp
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payloadString)
      .digest('hex')

    const providedSignature = signature.replace('sha256=', '')
    
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )
  } catch (error) {
    console.error('Error verifying webhook signature:', error)
    return false
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || request.ip || 'unknown'
}

function checkWebhookRateLimit(clientIP: string): { blocked: boolean; count: number; resetTime: number } {
  const key = `webhook:${clientIP}`
  const now = Date.now()
  const windowMs = 15 * 60 * 1000 // 15 minutes
  const maxRequests = 100

  let record = webhookRateLimit.get(key)
  
  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + windowMs
    }
    webhookRateLimit.set(key, record)
    return { blocked: false, count: 1, resetTime: record.resetTime }
  }
  
  record.count++
  webhookRateLimit.set(key, record)
  
  return {
    blocked: record.count > maxRequests,
    count: record.count,
    resetTime: record.resetTime
  }
}

async function cacheWebhookEvent(payload: WebhookPayload, userId: string, result: any): Promise<void> {
  try {
    const webhookEvent = {
      type: payload.type,
      source: payload.source,
      timestamp: payload.timestamp,
      userId,
      result,
      processed_at: new Date().toISOString()
    }

    // Cache for 24 hours
    await cacheManager.set(
      `webhook:${userId}:${Date.now()}`,
      webhookEvent,
      86400, // 24 hours
      undefined,
      [`user:${userId}`, 'webhooks']
    )
  } catch (error) {
    console.error('Error caching webhook event:', error)
  }
}

async function getWebhookHistory(userId: string): Promise<any[]> {
  try {
    // In a real implementation, fetch from database
    // For now, return mock history
    return [
      {
        id: 'wh_1',
        type: 'trade_executed',
        source: 'trading_bot',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        status: 'processed',
        data: {
          symbol: 'BTCUSDT',
          action: 'BUY',
          price: 45000,
          profit: 125.50
        }
      },
      {
        id: 'wh_2',
        type: 'agent_status_changed',
        source: 'agent_engine',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        status: 'processed',
        data: {
          agentId: 'agent_123',
          status: 'ACTIVE',
          reason: 'Restarted after maintenance'
        }
      }
    ]
  } catch (error) {
    console.error('Error fetching webhook history:', error)
    return []
  }
}

// Cleanup rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of Array.from(webhookRateLimit.entries())) {
    if (now > record.resetTime) {
      webhookRateLimit.delete(key)
    }
  }
}, 5 * 60 * 1000) // Every 5 minutes