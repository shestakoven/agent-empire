import nodemailer from 'nodemailer'
import { createTransport } from 'nodemailer'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface NotificationPreferences {
  tradeAlerts: boolean
  systemUpdates: boolean
  marketingEmails: boolean
  weeklyReports: boolean
  criticalAlerts: boolean
  agentPerformance: boolean
}

export interface EmailNotification {
  userId: string
  type: 'trade_alert' | 'system_update' | 'weekly_report' | 'critical_alert' | 'agent_performance' | 'welcome'
  subject: string
  data: Record<string, any>
  priority: 'low' | 'normal' | 'high' | 'critical'
  scheduledFor?: Date
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private isConfigured: boolean = false

  constructor() {
    this.initializeTransporter()
  }

  private initializeTransporter() {
    try {
      if (process.env.SENDGRID_API_KEY) {
        // SendGrid configuration
        this.transporter = createTransport({
          service: 'SendGrid',
          auth: {
            user: 'apikey',
            pass: process.env.SENDGRID_API_KEY
          }
        })
      } else if (process.env.SMTP_HOST) {
        // SMTP configuration
        this.transporter = createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_PORT === '465',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        })
      } else {
        console.warn('No email service configured. Email notifications will be logged only.')
        return
      }

      this.isConfigured = true
      console.log('✅ Email service initialized successfully')
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error)
    }
  }

  async sendNotification(notification: EmailNotification): Promise<boolean> {
    try {
      // Check if user wants this type of notification
      const preferences = await this.getUserPreferences(notification.userId)
      if (!this.shouldSendNotification(notification.type, preferences)) {
        console.log(`📧 Skipping ${notification.type} notification for user ${notification.userId} (preferences)`)
        return false
      }

      // Get user email
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true, name: true }
      })

      if (!user?.email) {
        console.error(`No email found for user ${notification.userId}`)
        return false
      }

      // Generate email content
      const template = await this.generateEmailTemplate(notification)
      
             if (this.isConfigured && this.transporter) {
         // Send email
         const mailOptions = {
           from: process.env.FROM_EMAIL || 'noreply@agent-empire.com',
           to: user.email,
           subject: template.subject,
           html: template.html,
           text: template.text,
           priority: this.getEmailPriority(notification.priority)
         }

         const result = await this.transporter.sendMail(mailOptions)
        console.log(`✅ Email sent to ${user.email}: ${notification.subject}`)
        
        // Log notification
        await this.logNotification(notification, user.email, 'sent', result.messageId)
        return true
      } else {
        // Log notification (development mode)
        console.log(`📧 [EMAIL LOG] To: ${user.email}, Subject: ${template.subject}`)
        console.log(`📧 [EMAIL CONTENT] ${template.text}`)
        
        await this.logNotification(notification, user.email, 'logged', 'dev-mode')
        return true
      }
    } catch (error) {
      console.error('❌ Failed to send email notification:', error)
      await this.logNotification(notification, 'unknown', 'failed', error instanceof Error ? error.message : 'Unknown error')
      return false
    }
  }

  private async generateEmailTemplate(notification: EmailNotification): Promise<EmailTemplate> {
    const templates = {
      trade_alert: this.generateTradeAlertTemplate,
      system_update: this.generateSystemUpdateTemplate,
      weekly_report: this.generateWeeklyReportTemplate,
      critical_alert: this.generateCriticalAlertTemplate,
      agent_performance: this.generateAgentPerformanceTemplate,
      welcome: this.generateWelcomeTemplate
    }

    const generator = templates[notification.type]
    if (!generator) {
      throw new Error(`Unknown notification type: ${notification.type}`)
    }

    return generator.call(this, notification)
  }

  private generateTradeAlertTemplate(notification: EmailNotification): EmailTemplate {
    const { agentName, action, symbol, price, profit, confidence } = notification.data

    const subject = `🤖 ${agentName} ${action} Alert - ${symbol}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-box { background: ${action === 'BUY' ? '#dcfce7' : '#fef2f2'}; border: 1px solid ${action === 'BUY' ? '#22c55e' : '#ef4444'}; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .metrics { display: flex; gap: 20px; margin: 20px 0; }
          .metric { background: #f9fafb; padding: 10px; border-radius: 5px; flex: 1; text-align: center; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤖 Agent Empire Trading Alert</h1>
        </div>
        <div class="content">
          <h2>Trade Executed by ${agentName}</h2>
          <div class="alert-box">
            <h3>${action} ${symbol} at $${price}</h3>
            <p>Your agent executed a ${action.toLowerCase()} order with ${confidence}% confidence.</p>
          </div>
          <div class="metrics">
            <div class="metric">
              <strong>Symbol</strong><br>${symbol}
            </div>
            <div class="metric">
              <strong>Price</strong><br>$${price}
            </div>
            <div class="metric">
              <strong>Profit/Loss</strong><br>${profit > 0 ? '+' : ''}$${profit.toFixed(2)}
            </div>
            <div class="metric">
              <strong>Confidence</strong><br>${confidence}%
            </div>
          </div>
          <p><a href="${process.env.APP_URL}/dashboard" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a></p>
        </div>
        <div class="footer">
          <p>Agent Empire - AI-Powered Trading Platform</p>
          <p><a href="${process.env.APP_URL}/settings/notifications">Manage Notifications</a></p>
        </div>
      </body>
      </html>
    `

    const text = `
Agent Empire Trading Alert

Trade Executed by ${agentName}
${action} ${symbol} at $${price}
Confidence: ${confidence}%
Profit/Loss: ${profit > 0 ? '+' : ''}$${profit.toFixed(2)}

View your dashboard: ${process.env.APP_URL}/dashboard
Manage notifications: ${process.env.APP_URL}/settings/notifications
    `

    return { subject, html, text }
  }

  private generateSystemUpdateTemplate(notification: EmailNotification): EmailTemplate {
    const { title, message, version, features } = notification.data

    const subject = `🔄 Agent Empire System Update - ${title}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .update-box { background: #eff6ff; border: 1px solid #3b82f6; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .feature-list { background: #f9fafb; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔄 Agent Empire Update</h1>
        </div>
        <div class="content">
          <div class="update-box">
            <h2>${title}</h2>
            <p><strong>Version:</strong> ${version}</p>
            <p>${message}</p>
          </div>
          ${features && features.length > 0 ? `
          <div class="feature-list">
            <h3>What's New:</h3>
            <ul>
              ${features.map((feature: string) => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          <p><a href="${process.env.APP_URL}" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Explore New Features</a></p>
        </div>
        <div class="footer">
          <p>Agent Empire - AI-Powered Trading Platform</p>
        </div>
      </body>
      </html>
    `

    const text = `
Agent Empire System Update

${title}
Version: ${version}

${message}

${features && features.length > 0 ? `
What's New:
${features.map((feature: string) => `• ${feature}`).join('\n')}
` : ''}

Explore new features: ${process.env.APP_URL}
    `

    return { subject, html, text }
  }

  private generateWeeklyReportTemplate(notification: EmailNotification): EmailTemplate {
    const { totalProfit, totalTrades, successRate, topAgent, period } = notification.data

    const subject = `📊 Your Weekly Trading Report - ${period}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-card { background: #f9fafb; padding: 15px; border-radius: 5px; text-align: center; }
          .profit-positive { color: #22c55e; }
          .profit-negative { color: #ef4444; }
          .agent-highlight { background: #eff6ff; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Weekly Trading Report</h1>
          <p>${period}</p>
        </div>
        <div class="content">
          <h2>Performance Summary</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <h3 class="${totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}
              </h3>
              <p>Total Profit/Loss</p>
            </div>
            <div class="stat-card">
              <h3>${totalTrades}</h3>
              <p>Total Trades</p>
            </div>
            <div class="stat-card">
              <h3>${successRate.toFixed(1)}%</h3>
              <p>Success Rate</p>
            </div>
            <div class="stat-card">
              <h3>${topAgent?.name || 'N/A'}</h3>
              <p>Top Performing Agent</p>
            </div>
          </div>
          ${topAgent ? `
          <div class="agent-highlight">
            <h3>🏆 Agent Spotlight: ${topAgent.name}</h3>
            <p>Your top performer this week with ${topAgent.successRate}% success rate and $${topAgent.profit.toFixed(2)} profit!</p>
          </div>
          ` : ''}
          <p><a href="${process.env.APP_URL}/stats" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Detailed Analytics</a></p>
        </div>
        <div class="footer">
          <p>Agent Empire - AI-Powered Trading Platform</p>
          <p><a href="${process.env.APP_URL}/settings/notifications">Manage Notifications</a></p>
        </div>
      </body>
      </html>
    `

    const text = `
Weekly Trading Report - ${period}

Performance Summary:
• Total Profit/Loss: ${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}
• Total Trades: ${totalTrades}
• Success Rate: ${successRate.toFixed(1)}%
• Top Performing Agent: ${topAgent?.name || 'N/A'}

${topAgent ? `
🏆 Agent Spotlight: ${topAgent.name}
Your top performer this week with ${topAgent.successRate}% success rate and $${topAgent.profit.toFixed(2)} profit!
` : ''}

View detailed analytics: ${process.env.APP_URL}/stats
Manage notifications: ${process.env.APP_URL}/settings/notifications
    `

    return { subject, html, text }
  }

  private generateCriticalAlertTemplate(notification: EmailNotification): EmailTemplate {
    const { alertType, message, severity, action } = notification.data

    const subject = `🚨 CRITICAL ALERT: ${alertType}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .alert-box { background: #fef2f2; border: 2px solid #dc2626; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .action-required { background: #fbbf24; color: #78350f; padding: 15px; border-radius: 5px; margin: 15px 0; font-weight: bold; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚨 CRITICAL ALERT</h1>
          <p>${alertType} - ${severity.toUpperCase()}</p>
        </div>
        <div class="content">
          <div class="alert-box">
            <h2>Immediate Attention Required</h2>
            <p>${message}</p>
          </div>
          ${action ? `
          <div class="action-required">
            <strong>Action Required:</strong> ${action}
          </div>
          ` : ''}
          <p><a href="${process.env.APP_URL}/dashboard" style="background: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Check Dashboard Now</a></p>
        </div>
        <div class="footer">
          <p>Agent Empire - AI-Powered Trading Platform</p>
          <p>This is a critical alert. Please take immediate action.</p>
        </div>
      </body>
      </html>
    `

    const text = `
🚨 CRITICAL ALERT: ${alertType}
Severity: ${severity.toUpperCase()}

Immediate Attention Required:
${message}

${action ? `Action Required: ${action}` : ''}

Check your dashboard immediately: ${process.env.APP_URL}/dashboard
    `

    return { subject, html, text }
  }

  private generateAgentPerformanceTemplate(notification: EmailNotification): EmailTemplate {
    const { agentName, performance, recommendation } = notification.data

    const subject = `🤖 Agent Performance Update: ${agentName}`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .performance-box { background: #f0f9ff; border: 1px solid #0ea5e9; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 15px 0; }
          .metric { background: #f9fafb; padding: 10px; border-radius: 5px; text-align: center; }
          .recommendation { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🤖 Agent Performance Update</h1>
        </div>
        <div class="content">
          <div class="performance-box">
            <h2>${agentName} Performance Report</h2>
            <div class="metrics">
              <div class="metric">
                <strong>${performance.totalTrades}</strong><br>Total Trades
              </div>
              <div class="metric">
                <strong>${performance.successRate.toFixed(1)}%</strong><br>Success Rate
              </div>
              <div class="metric">
                <strong class="${performance.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}">
                  ${performance.totalProfit >= 0 ? '+' : ''}$${performance.totalProfit.toFixed(2)}
                </strong><br>Total Profit
              </div>
            </div>
          </div>
          ${recommendation ? `
          <div class="recommendation">
            <h3>💡 Recommendation</h3>
            <p>${recommendation}</p>
          </div>
          ` : ''}
          <p><a href="${process.env.APP_URL}/dashboard" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Manage Agent</a></p>
        </div>
        <div class="footer">
          <p>Agent Empire - AI-Powered Trading Platform</p>
        </div>
      </body>
      </html>
    `

    const text = `
Agent Performance Update: ${agentName}

Performance Summary:
• Total Trades: ${performance.totalTrades}
• Success Rate: ${performance.successRate.toFixed(1)}%
• Total Profit: ${performance.totalProfit >= 0 ? '+' : ''}$${performance.totalProfit.toFixed(2)}

${recommendation ? `💡 Recommendation: ${recommendation}` : ''}

Manage your agent: ${process.env.APP_URL}/dashboard
    `

    return { subject, html, text }
  }

  private generateWelcomeTemplate(notification: EmailNotification): EmailTemplate {
    const { userName } = notification.data

    const subject = `🎉 Welcome to Agent Empire, ${userName}!`
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .welcome-box { background: #ecfdf5; border: 1px solid #10b981; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
          .steps { background: #f9fafb; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .step { margin: 15px 0; padding: 10px; border-left: 3px solid #3b82f6; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 Welcome to Agent Empire!</h1>
        </div>
        <div class="content">
          <div class="welcome-box">
            <h2>Hello ${userName}!</h2>
            <p>Welcome to the future of AI-powered trading. Your account is ready and we're excited to help you build your agent empire!</p>
          </div>
          <div class="steps">
            <h3>Get Started in 3 Easy Steps:</h3>
            <div class="step">
              <strong>1. Create Your First Agent</strong><br>
              Choose from our trading strategies and customize your agent's personality.
            </div>
            <div class="step">
              <strong>2. Start Paper Trading</strong><br>
              Test your agents with virtual money to see how they perform.
            </div>
            <div class="step">
              <strong>3. Monitor Performance</strong><br>
              Watch your agents trade and optimize their strategies.
            </div>
          </div>
          <p style="text-align: center;">
            <a href="${process.env.APP_URL}/create" style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-size: 16px;">Create Your First Agent</a>
          </p>
        </div>
        <div class="footer">
          <p>Agent Empire - AI-Powered Trading Platform</p>
          <p>Need help? Check our <a href="${process.env.APP_URL}/docs">documentation</a> or contact support.</p>
        </div>
      </body>
      </html>
    `

    const text = `
Welcome to Agent Empire, ${userName}!

Welcome to the future of AI-powered trading. Your account is ready and we're excited to help you build your agent empire!

Get Started in 3 Easy Steps:

1. Create Your First Agent
   Choose from our trading strategies and customize your agent's personality.

2. Start Paper Trading
   Test your agents with virtual money to see how they perform.

3. Monitor Performance
   Watch your agents trade and optimize their strategies.

Create your first agent: ${process.env.APP_URL}/create

Need help? Check our documentation: ${process.env.APP_URL}/docs
    `

    return { subject, html, text }
  }

  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      // In a real implementation, this would fetch from database
      // For now, return default preferences
      return {
        tradeAlerts: true,
        systemUpdates: true,
        marketingEmails: false,
        weeklyReports: true,
        criticalAlerts: true,
        agentPerformance: true
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      // Return default preferences on error
      return {
        tradeAlerts: true,
        systemUpdates: true,
        marketingEmails: false,
        weeklyReports: true,
        criticalAlerts: true,
        agentPerformance: true
      }
    }
  }

  private shouldSendNotification(type: string, preferences: NotificationPreferences): boolean {
    const mapping = {
      trade_alert: preferences.tradeAlerts,
      system_update: preferences.systemUpdates,
      weekly_report: preferences.weeklyReports,
      critical_alert: preferences.criticalAlerts,
      agent_performance: preferences.agentPerformance,
      welcome: true // Always send welcome emails
    }

    return mapping[type as keyof typeof mapping] ?? false
  }

  private getEmailPriority(priority: string): 'high' | 'normal' | 'low' {
    const mapping = {
      critical: 'high' as const,
      high: 'high' as const,
      normal: 'normal' as const,
      low: 'low' as const
    }
    return mapping[priority as keyof typeof mapping] || 'normal'
  }

  private async logNotification(
    notification: EmailNotification,
    email: string,
    status: 'sent' | 'failed' | 'logged',
    details: string
  ) {
    try {
      // In a real implementation, save to database
      console.log(`📧 Notification Log:`, {
        userId: notification.userId,
        email,
        type: notification.type,
        subject: notification.subject,
        status,
        details,
        timestamp: new Date()
      })
    } catch (error) {
      console.error('Failed to log notification:', error)
    }
  }

  // Public methods for common notifications
  async sendTradeAlert(userId: string, agentName: string, trade: any) {
    return this.sendNotification({
      userId,
      type: 'trade_alert',
      subject: `Trade Alert - ${agentName}`,
      data: {
        agentName,
        action: trade.action,
        symbol: trade.symbol,
        price: trade.price,
        profit: trade.profit || 0,
        confidence: trade.confidence || 0
      },
      priority: 'normal'
    })
  }

  async sendWeeklyReport(userId: string, reportData: any) {
    return this.sendNotification({
      userId,
      type: 'weekly_report',
      subject: 'Your Weekly Trading Report',
      data: reportData,
      priority: 'low'
    })
  }

  async sendCriticalAlert(userId: string, alertType: string, message: string, action?: string) {
    return this.sendNotification({
      userId,
      type: 'critical_alert',
      subject: `Critical Alert: ${alertType}`,
      data: {
        alertType,
        message,
        severity: 'critical',
        action
      },
      priority: 'critical'
    })
  }

  async sendWelcomeEmail(userId: string, userName: string) {
    return this.sendNotification({
      userId,
      type: 'welcome',
      subject: `Welcome to Agent Empire, ${userName}!`,
      data: { userName },
      priority: 'normal'
    })
  }

  async sendAgentPerformanceUpdate(userId: string, agentName: string, performance: any, recommendation?: string) {
    return this.sendNotification({
      userId,
      type: 'agent_performance',
      subject: `Agent Performance Update: ${agentName}`,
      data: {
        agentName,
        performance,
        recommendation
      },
      priority: 'low'
    })
  }

  // Bulk operations
  async sendBulkNotifications(notifications: EmailNotification[]): Promise<{ sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    // Process in batches to avoid overwhelming the email service
    const batchSize = 10
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize)
      const results = await Promise.allSettled(
        batch.map(notification => this.sendNotification(notification))
      )

      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          sent++
        } else {
          failed++
        }
      })

      // Rate limiting - wait between batches
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return { sent, failed }
  }

  // Scheduled notifications
  async scheduleWeeklyReports() {
    try {
      // Get all users who want weekly reports
      const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true }
      })

      const notifications: EmailNotification[] = []
      
      for (const user of users) {
        // Calculate user's weekly performance
        const weeklyData = await this.calculateWeeklyPerformance(user.id)
        
        notifications.push({
          userId: user.id,
          type: 'weekly_report',
          subject: 'Your Weekly Trading Report',
          data: weeklyData,
          priority: 'low'
        })
      }

      const result = await this.sendBulkNotifications(notifications)
      console.log(`📊 Weekly reports sent: ${result.sent} successful, ${result.failed} failed`)
      
      return result
    } catch (error) {
      console.error('Error scheduling weekly reports:', error)
      return { sent: 0, failed: 0 }
    }
  }

  private async calculateWeeklyPerformance(userId: string) {
    // This would calculate actual performance from database
    // For now, return mock data
    return {
      totalProfit: Math.random() * 1000 - 500,
      totalTrades: Math.floor(Math.random() * 50),
      successRate: Math.random() * 100,
      topAgent: {
        name: 'Trading Bot Alpha',
        successRate: 85.5,
        profit: 234.56
      },
      period: `${new Date().toLocaleDateString()} - ${new Date().toLocaleDateString()}`
    }
  }
}

// Singleton instance
const emailService = new EmailService()

export default emailService
export { EmailService }