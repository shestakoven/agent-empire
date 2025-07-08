import AgentBrain, { AgentDecision, AgentMemory, AgentPersonality, MarketData } from '../ai/agent-brain'
import TradingEngine, { Portfolio, RiskManagement, TradeOrder } from '../trading/trading-engine'
import { PrismaClient } from '@prisma/client'

export interface AgentConfig {
  id: string
  name: string
  type: 'trading' | 'content' | 'automation'
  personality: AgentPersonality
  riskManagement: RiskManagement
  goals: string
  maxBudget: number
  tradingPairs?: string[]
  socialPlatforms?: string[]
  automationTasks?: string[]
  isActive: boolean
  userId: string
}

export interface AgentExecution {
  agentId: string
  timestamp: Date
  decision: AgentDecision
  outcome?: 'success' | 'failure' | 'pending'
  profit?: number
  error?: string
  executionTime: number
}

export interface AgentMetrics {
  agentId: string
  totalExecutions: number
  successfulExecutions: number
  failedExecutions: number
  totalProfit: number
  avgExecutionTime: number
  lastExecution: Date
  uptime: number
  successRate: number
}

class AgentEngine {
  private agents: Map<string, {
    config: AgentConfig
    brain: AgentBrain
    tradingEngine?: TradingEngine
    isRunning: boolean
    lastExecution: Date
    metrics: AgentMetrics
    executionHistory: AgentExecution[]
  }> = new Map()

  private prisma: PrismaClient
  private globalRunning: boolean = false
  private executionInterval: number = 30000 // 30 seconds
  private maxConcurrentExecutions: number = 10

  constructor() {
    this.prisma = new PrismaClient()
  }

  async startEngine() {
    if (this.globalRunning) {
      console.log('Agent engine is already running')
      return
    }

    this.globalRunning = true
    console.log('🚀 Agent Engine started - Loading active agents...')

    // Load all active agents from database
    await this.loadActiveAgents()

    // Start the main execution loop
    this.startExecutionLoop()

    console.log(`✅ Agent Engine running with ${this.agents.size} agents`)
  }

  async stopEngine() {
    this.globalRunning = false
    console.log('🛑 Agent Engine stopped')
  }

  async createAgent(agentConfig: AgentConfig): Promise<string> {
    try {
      // Create agent brain
      const personality: AgentPersonality = agentConfig.personality
      const brain = new AgentBrain(personality, agentConfig.type)

      // Create trading engine if it's a trading agent
      let tradingEngine: TradingEngine | undefined
      if (agentConfig.type === 'trading') {
        tradingEngine = new TradingEngine({
          apiKey: process.env.BINANCE_API_KEY || 'demo',
          apiSecret: process.env.BINANCE_API_SECRET || 'demo',
          paperTrading: true, // Always start with paper trading for safety
          riskManagement: agentConfig.riskManagement
        })
      }

      // Initialize metrics
      const metrics: AgentMetrics = {
        agentId: agentConfig.id,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalProfit: 0,
        avgExecutionTime: 0,
        lastExecution: new Date(),
        uptime: 0,
        successRate: 0
      }

      // Store agent in memory
      this.agents.set(agentConfig.id, {
        config: agentConfig,
        brain,
        tradingEngine,
        isRunning: agentConfig.isActive,
        lastExecution: new Date(),
        metrics,
        executionHistory: []
      })

      console.log(`✅ Agent created: ${agentConfig.name} (${agentConfig.type})`)
      return agentConfig.id
    } catch (error) {
      console.error('Error creating agent:', error)
      throw new Error('Failed to create agent')
    }
  }

  async startAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }

    agent.isRunning = true
    console.log(`▶️ Agent started: ${agent.config.name}`)

    // Update database
    await this.updateAgentStatus(agentId, 'active')
  }

  async stopAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }

    agent.isRunning = false
    console.log(`⏸️ Agent stopped: ${agent.config.name}`)

    // Update database
    await this.updateAgentStatus(agentId, 'paused')
  }

  async removeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }

    this.agents.delete(agentId)
    console.log(`🗑️ Agent removed: ${agent.config.name}`)

    // Update database
    await this.updateAgentStatus(agentId, 'stopped')
  }

  private async loadActiveAgents() {
    try {
      const activeAgents = await this.prisma.agent.findMany({
        where: { status: 'active' }
      })

      for (const dbAgent of activeAgents) {
        const agentConfig: AgentConfig = {
          id: dbAgent.id,
          name: dbAgent.name,
          type: dbAgent.type as 'trading' | 'content' | 'automation',
          personality: this.parsePersonality(dbAgent.personality),
          riskManagement: this.parseRiskManagement(dbAgent),
          goals: dbAgent.goals || '',
          maxBudget: dbAgent.maxBudget,
          tradingPairs: dbAgent.tradingPairs ? JSON.parse(dbAgent.tradingPairs) : [],
          socialPlatforms: dbAgent.socialPlatforms ? JSON.parse(dbAgent.socialPlatforms) : [],
          automationTasks: dbAgent.automationTasks ? JSON.parse(dbAgent.automationTasks) : [],
          isActive: true,
          userId: dbAgent.userId
        }

        await this.createAgent(agentConfig)
      }
    } catch (error) {
      console.error('Error loading active agents:', error)
    }
  }

  private parsePersonality(personalityStr: string): AgentPersonality {
    // Parse personality from database string
    // For demo, return a default personality
    return {
      riskTolerance: 'medium',
      decisionSpeed: 'medium',
      learningRate: 'adaptive',
      creativity: 5,
      analyticalDepth: 7
    }
  }

  private parseRiskManagement(dbAgent: any): RiskManagement {
    return {
      maxPositionSize: 10, // 10% of portfolio
      stopLossPercent: 5,
      takeProfitPercent: 15,
      maxDailyLoss: dbAgent.maxBudget * 0.05, // 5% of max budget
      maxOpenPositions: 3,
      allowedPairs: dbAgent.tradingPairs ? JSON.parse(dbAgent.tradingPairs) : ['BTCUSDT', 'ETHUSDT']
    }
  }

  private async startExecutionLoop() {
    while (this.globalRunning) {
      try {
        await this.executeAllAgents()
        await this.sleep(this.executionInterval)
      } catch (error) {
        console.error('Error in execution loop:', error)
        await this.sleep(5000) // Wait 5 seconds before retrying
      }
    }
  }

  private async executeAllAgents() {
    const activeAgents = Array.from(this.agents.values()).filter(agent => agent.isRunning)
    
    if (activeAgents.length === 0) {
      return
    }

    console.log(`🔄 Executing ${activeAgents.length} active agents...`)

    // Execute agents in batches to avoid overwhelming the system
    const batches = this.chunkArray(activeAgents, this.maxConcurrentExecutions)
    
    for (const batch of batches) {
      const promises = batch.map(agent => this.executeAgent(agent.config.id))
      await Promise.allSettled(promises)
    }
  }

  private async executeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent || !agent.isRunning) {
      return
    }

    const startTime = Date.now()
    let execution: AgentExecution | undefined

    try {
      console.log(`🤖 Executing agent: ${agent.config.name}`)

      // Gather context for decision making
      const context = await this.gatherAgentContext(agent)

      // Make AI decision
      const decision = await agent.brain.makeDecision(context)
      console.log(`💭 Agent decision: ${decision.action} (${decision.confidence}% confidence)`)

      // Create execution record
      execution = {
        agentId,
        timestamp: new Date(),
        decision,
        outcome: 'pending',
        executionTime: Date.now() - startTime
      }

      // Execute the decision
      await this.executeDecision(agent, decision, execution)

      // Update metrics
      agent.lastExecution = new Date()
      agent.metrics.totalExecutions++
      agent.metrics.avgExecutionTime = 
        (agent.metrics.avgExecutionTime + execution.executionTime) / agent.metrics.totalExecutions

      // Store execution in history
      agent.executionHistory.push(execution)
      if (agent.executionHistory.length > 100) {
        agent.executionHistory = agent.executionHistory.slice(-100)
      }

      // Update database
      await this.updateAgentMetrics(agentId, agent.metrics)

    } catch (error) {
      console.error(`❌ Agent execution failed: ${agent.config.name}`, error)
      
      if (execution) {
        execution.outcome = 'failure'
        execution.error = error instanceof Error ? error.message : 'Unknown error'
        agent.metrics.failedExecutions++
      }
    }
  }

  private async gatherAgentContext(agent: any): Promise<any> {
    const context: any = {
      timeframe: '1h'
    }

    try {
      if (agent.config.type === 'trading' && agent.tradingEngine) {
        // Get market data for trading pairs
        const symbols = agent.config.tradingPairs || ['BTCUSDT', 'ETHUSDT']
        context.marketData = await agent.tradingEngine.getMarketData(symbols)
        context.portfolio = await agent.tradingEngine.getPortfolio()

        // Add technical analysis
        for (const symbol of symbols.slice(0, 2)) { // Limit to avoid rate limits
          const rsi = await agent.tradingEngine.calculateRSI(symbol)
          const trend = await agent.tradingEngine.getTrendDirection(symbol)
          
          context[`${symbol}_RSI`] = rsi
          context[`${symbol}_TREND`] = trend
        }
      }

      if (agent.config.type === 'content') {
        // Get social metrics (mock for demo)
        context.socialMetrics = {
          followers: 1250,
          engagement: 4.2,
          recentPosts: 5
        }
      }

      if (agent.config.type === 'automation') {
        // Get pending tasks (mock for demo)
        context.tasks = [
          { id: 1, priority: 'high', type: 'data_analysis' },
          { id: 2, priority: 'medium', type: 'report_generation' }
        ]
      }
    } catch (error) {
      console.error('Error gathering context:', error)
    }

    return context
  }

  private async executeDecision(agent: any, decision: AgentDecision, execution: AgentExecution): Promise<void> {
    try {
      switch (decision.type) {
        case 'trade':
          await this.executeTradeDecision(agent, decision, execution)
          break
        case 'content':
          await this.executeContentDecision(agent, decision, execution)
          break
        case 'task':
          await this.executeTaskDecision(agent, decision, execution)
          break
        default:
          console.log(`Unknown decision type: ${decision.type}`)
      }
    } catch (error) {
      execution.outcome = 'failure'
      execution.error = error instanceof Error ? error.message : 'Unknown error'
      throw error
    }
  }

  private async executeTradeDecision(agent: any, decision: AgentDecision, execution: AgentExecution): Promise<void> {
    if (!agent.tradingEngine) {
      throw new Error('Trading engine not available')
    }

    const params = decision.parameters
    
    if (params.action === 'buy' || params.action === 'sell') {
      const order: Omit<TradeOrder, 'id' | 'status' | 'timestamp' | 'executedQty' | 'executedPrice'> = {
        symbol: params.symbol,
        side: params.action.toUpperCase() as 'BUY' | 'SELL',
        type: 'MARKET',
        quantity: params.amount || 0.001
      }

      const result = await agent.tradingEngine.executeOrder(order)
      
      if (result.status === 'FILLED') {
        execution.outcome = 'success'
        execution.profit = this.calculateTradeProfit(result)
        agent.metrics.successfulExecutions++
        agent.metrics.totalProfit += execution.profit || 0
        
        console.log(`✅ Trade executed: ${result.side} ${result.executedQty} ${result.symbol} at $${result.executedPrice}`)
      } else {
        execution.outcome = 'failure'
        execution.error = 'Trade was not filled'
      }
    } else {
      execution.outcome = 'success'
      console.log(`📊 Analysis completed: ${decision.reasoning}`)
    }
  }

  private async executeContentDecision(agent: any, decision: AgentDecision, execution: AgentExecution): Promise<void> {
    const params = decision.parameters
    
    // Mock content creation execution
    const mockEngagement = Math.random() * 1000 + 100
    
    execution.outcome = 'success'
    execution.profit = mockEngagement * 0.01 // Mock monetization
    agent.metrics.successfulExecutions++
    agent.metrics.totalProfit += execution.profit

    console.log(`📱 Content created for ${params.platform}: "${params.content?.substring(0, 50)}..." - Expected engagement: ${mockEngagement}`)
  }

  private async executeTaskDecision(agent: any, decision: AgentDecision, execution: AgentExecution): Promise<void> {
    const params = decision.parameters
    
    // Mock task automation execution
    const efficiency = Math.random() * 0.5 + 0.5 // 50-100% efficiency
    
    execution.outcome = 'success'
    execution.profit = efficiency * 50 // Mock value creation
    agent.metrics.successfulExecutions++
    agent.metrics.totalProfit += execution.profit

    console.log(`⚙️ Task automated: ${params.taskType} - Efficiency: ${(efficiency * 100).toFixed(1)}%`)
  }

  private calculateTradeProfit(order: TradeOrder): number {
    // This is a simplified calculation
    // In reality, you'd track entry/exit prices and calculate P&L
    return Math.random() * 20 - 10 // Random profit between -$10 and +$10 for demo
  }

  private async updateAgentStatus(agentId: string, status: string): Promise<void> {
    try {
      await this.prisma.agent.update({
        where: { id: agentId },
        data: { 
          status,
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error updating agent status:', error)
    }
  }

  private async updateAgentMetrics(agentId: string, metrics: AgentMetrics): Promise<void> {
    try {
      await this.prisma.agent.update({
        where: { id: agentId },
        data: {
          earnings: metrics.totalProfit,
          lastActivity: new Date(),
          updatedAt: new Date()
        }
      })
    } catch (error) {
      console.error('Error updating agent metrics:', error)
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Public API methods
  getAgentMetrics(agentId: string): AgentMetrics | null {
    const agent = this.agents.get(agentId)
    return agent?.metrics || null
  }

  getAgentExecutionHistory(agentId: string): AgentExecution[] {
    const agent = this.agents.get(agentId)
    return agent?.executionHistory || []
  }

  getAllAgents(): AgentConfig[] {
    return Array.from(this.agents.values()).map(agent => agent.config)
  }

  getRunningAgentsCount(): number {
    return Array.from(this.agents.values()).filter(agent => agent.isRunning).length
  }

  getEngineStatus(): {
    isRunning: boolean
    totalAgents: number
    runningAgents: number
    totalExecutions: number
    uptime: number
  } {
    const totalExecutions = Array.from(this.agents.values())
      .reduce((sum, agent) => sum + agent.metrics.totalExecutions, 0)

    return {
      isRunning: this.globalRunning,
      totalAgents: this.agents.size,
      runningAgents: this.getRunningAgentsCount(),
      totalExecutions,
      uptime: Date.now() // Simplified uptime
    }
  }

  // Advanced features
  async optimizeAgent(agentId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }

    // Analyze performance and suggest optimizations
    const successRate = agent.metrics.successRate
    
    if (successRate < 0.6) {
      // Adjust personality for better performance
      const currentPersonality = agent.brain.getMemory()
      console.log(`🔧 Optimizing agent ${agent.config.name} - Current success rate: ${(successRate * 100).toFixed(1)}%`)
      
      // This could implement more sophisticated optimization algorithms
    }
  }

  async createAgentBackup(agentId: string): Promise<string> {
    const agent = this.agents.get(agentId)
    if (!agent) {
      throw new Error('Agent not found')
    }

    const backup = {
      config: agent.config,
      memory: agent.brain.getMemory(),
      metrics: agent.metrics,
      timestamp: new Date()
    }

    // In production, save to file or database
    console.log(`💾 Agent backup created for: ${agent.config.name}`)
    return JSON.stringify(backup)
  }

  async restoreAgentFromBackup(backupData: string): Promise<string> {
    const backup = JSON.parse(backupData)
    
    // Restore agent from backup
    const agentId = await this.createAgent(backup.config)
    
    // Restore memory and metrics
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.metrics = backup.metrics
      // agent.brain.restoreMemory(backup.memory) // Would need to implement this
    }

    console.log(`🔄 Agent restored from backup: ${backup.config.name}`)
    return agentId
  }
}

// Singleton instance
const agentEngine = new AgentEngine()

export default agentEngine
export { AgentEngine }