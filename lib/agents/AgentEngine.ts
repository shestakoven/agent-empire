import { AgentBrain, AgentConfig, AgentDecision } from './AgentBrain'
import { TradingEngine, TradeResult } from './TradingEngine'

export interface AgentStatus {
  isRunning: boolean
  currentTask: string
  lastDecision: AgentDecision | null
  lastActivity: string
  cycleCount: number
  performance: any
}

export class AgentEngine {
  private brain: AgentBrain
  private trading: TradingEngine
  private isRunning: boolean = false
  private currentTask: string = 'Initializing'
  private lastDecision: AgentDecision | null = null
  private lastActivity: string = 'Just started'
  private cycleCount: number = 0
  private cycleInterval: NodeJS.Timeout | null = null

  constructor(agentConfig: AgentConfig) {
    this.brain = new AgentBrain(agentConfig)
    this.trading = new TradingEngine(agentConfig)
    
    console.log(`🤖 Agent "${agentConfig.name}" created with ${agentConfig.personality} personality`)
  }

  async start() {
    if (this.isRunning) {
      console.log('Agent is already running')
      return
    }

    this.isRunning = true
    this.currentTask = 'Running analysis cycle'
    console.log(`🚀 Agent ${this.brain.name} starting...`)
    
    // Run first cycle immediately
    await this.executeCycle()
    
    // Then run cycles every 30 seconds (for testing - in production this would be longer)
    this.cycleInterval = setInterval(async () => {
      if (this.isRunning) {
        await this.executeCycle()
      }
    }, 30000) // 30 seconds
  }

  private async executeCycle() {
    this.cycleCount++
    this.currentTask = `Executing cycle #${this.cycleCount}`
    
    try {
      console.log(`\n🔄 Agent ${this.brain.name} - Cycle #${this.cycleCount}`)
      
      // 1. Gather market data
      this.currentTask = 'Analyzing market data'
      const marketData = await this.trading.getMarketData('BTC/USDT')
      
      // 2. Analyze portfolio
      const portfolio = this.trading.getPortfolio()
      const portfolioValue = this.trading.getPortfolioValue()
      
      // 3. Get market analysis
      const marketAnalysis = await this.trading.analyzeMarket('BTC/USDT')
      
      // 4. Let agent brain decide what to do
      this.currentTask = 'Making decision'
      const situation = `Market cycle analysis`
      const context = {
        marketData,
        portfolio: Object.fromEntries(portfolio),
        portfolioValue,
        marketAnalysis,
        cycleNumber: this.cycleCount,
        paperTrading: this.trading.isPaperTrading()
      }
      
      console.log(`💭 Current context:`)
      console.log(`   BTC Price: $${marketData.price.toLocaleString()}`)
      console.log(`   24h Change: ${marketData.change24h.toFixed(2)}%`)
      console.log(`   Portfolio Value: $${portfolioValue.toFixed(2)}`)
      console.log(`   Trend: ${marketAnalysis.trend}`)
      console.log(`   Recommendation: ${marketAnalysis.recommendation}`)
      
      const decision = await this.brain.think(situation, context)
      this.lastDecision = decision
      
      console.log(`🧠 Agent Decision: ${decision.action}`)
      console.log(`📝 Reasoning: ${decision.reasoning}`)
      console.log(`🎯 Confidence: ${(decision.confidence * 100).toFixed(1)}%`)
      
      // 5. Execute the decision
      this.currentTask = `Executing: ${decision.action}`
      const result = await this.executeDecision(decision)
      
      // 6. Update memory and learning
      await this.brain.updateMemory(decision, context, result)
      
      // 7. Update activity log
      this.lastActivity = `${decision.action}: ${decision.reasoning}`
      this.currentTask = 'Waiting for next cycle'
      
      console.log(`✅ Cycle #${this.cycleCount} completed\n`)
      
    } catch (error) {
      console.error('❌ Agent cycle error:', error)
      this.currentTask = 'Error occurred'
      this.lastActivity = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  private async executeDecision(decision: AgentDecision): Promise<any> {
    let result: any = { success: false }
    
    switch (decision.action) {
      case 'execute_trade':
        console.log(`💱 Executing trade...`)
        result = await this.trading.executeTrade(decision.parameters)
        
        if (result.success) {
          console.log(`✅ Trade successful!`)
          console.log(`   Order ID: ${result.orderId}`)
          console.log(`   Price: $${result.executedPrice?.toFixed(2)}`)
          if (result.profit) {
            console.log(`   Profit: $${result.profit.toFixed(2)}`)
          }
        } else {
          console.log(`❌ Trade failed: ${result.error}`)
        }
        break
        
      case 'create_content':
        console.log(`📝 Creating content...`)
        result = await this.createContent(decision.parameters)
        break
        
      case 'automate_task':
        console.log(`⚙️ Executing task...`)
        result = await this.executeTask(decision.parameters)
        break
        
      case 'wait_and_observe':
        console.log(`⏳ Waiting and observing...`)
        result = { 
          success: true, 
          action: 'observed',
          learning: `Decided to wait: ${decision.parameters.reasoning}`
        }
        break
        
      default:
        console.log(`❓ Unknown action: ${decision.action}`)
        result = { success: false, error: 'Unknown action' }
    }
    
    return result
  }

  private async createContent(params: any): Promise<any> {
    // Simplified content creation for demo
    console.log(`📱 Creating ${params.content_type} content about ${params.topic} for ${params.platform}`)
    
    // In real implementation, this would use AI to generate actual content
    const content = `🤖 AI Agent Alert: Just analyzed the crypto market! ${params.topic} is trending ${params.tone} today. What do you think? #AI #Crypto #Trading`
    
    return {
      success: true,
      content,
      platform: params.platform,
      engagement: Math.floor(Math.random() * 100), // Simulated engagement
      learning: `Generated ${params.content_type} content for ${params.platform}`
    }
  }

  private async executeTask(params: any): Promise<any> {
    console.log(`🔧 Executing ${params.task_type} task`)
    
    // Simplified task execution for demo
    return {
      success: true,
      taskType: params.task_type,
      result: `Completed ${params.task_type} successfully`,
      learning: `Executed automation task: ${params.task_type}`
    }
  }

  stop() {
    this.isRunning = false
    this.currentTask = 'Stopped'
    
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval)
      this.cycleInterval = null
    }
    
    console.log(`🛑 Agent ${this.brain.name} stopped`)
  }

  getStatus(): AgentStatus {
    return {
      isRunning: this.isRunning,
      currentTask: this.currentTask,
      lastDecision: this.lastDecision,
      lastActivity: this.lastActivity,
      cycleCount: this.cycleCount,
      performance: this.brain.getPerformanceMetrics()
    }
  }

  async getPortfolio() {
    const portfolio = this.trading.getPortfolio()
    const value = this.trading.getPortfolioValue()
    
    return {
      holdings: Object.fromEntries(portfolio),
      totalValue: value,
      paperTrading: this.trading.isPaperTrading()
    }
  }

  async getMemory() {
    return this.brain.getMemory()
  }

  // Manual controls for testing
  async triggerAnalysis() {
    if (!this.isRunning) return
    console.log('🔄 Manual analysis triggered')
    await this.executeCycle()
  }

  enableRealTrading() {
    this.trading.enableRealTrading()
  }

  enablePaperTrading() {
    this.trading.enablePaperTrading()
  }
}