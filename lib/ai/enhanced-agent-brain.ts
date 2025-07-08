import OpenAI from 'openai'
import TradingEngine from '@/lib/trading/trading-engine'
import { StrategyFactory, TradingSignal } from '@/lib/trading/strategies/trading-strategies'
import webSocketServer from '@/lib/websocket/websocket-server'

export interface AgentMemory {
  decisions: DecisionRecord[]
  learnings: Learning[]
  marketConditions: MarketCondition[]
  personalityAdjustments: PersonalityAdjustment[]
}

export interface DecisionRecord {
  timestamp: Date
  context: string
  decision: any
  outcome: 'success' | 'failure' | 'neutral'
  profit: number
  confidence: number
  reasoning: string
  marketConditions: {
    rsi: number
    trend: string
    volatility: number
  }
}

export interface Learning {
  pattern: string
  condition: string
  successRate: number
  averageProfit: number
  confidence: number
  lastUpdated: Date
}

export interface MarketCondition {
  timestamp: Date
  symbol: string
  price: number
  trend: 'BULLISH' | 'BEARISH' | 'SIDEWAYS'
  volatility: 'LOW' | 'MEDIUM' | 'HIGH'
  volume: number
  indicators: Record<string, number>
}

export interface PersonalityAdjustment {
  trait: string
  originalValue: number
  adjustedValue: number
  reason: string
  performance: number
  timestamp: Date
}

export interface EnhancedAgentDecision {
  type: 'trade' | 'content' | 'automation' | 'analysis'
  action: string
  reasoning: string
  confidence: number
  riskLevel: 'low' | 'medium' | 'high'
  expectedOutcome: string
  tradingSignal?: TradingSignal
  parameters: Record<string, any>
  alternatives: Array<{
    action: string
    confidence: number
    reasoning: string
  }>
  marketAnalysis?: {
    technicalIndicators: Record<string, number>
    sentiment: 'bullish' | 'bearish' | 'neutral'
    riskFactors: string[]
    opportunities: string[]
  }
}

export interface AgentPersonality {
  risk_tolerance: number // 0-100
  aggression: number // 0-100
  analytical_depth: number // 0-100
  learning_rate: number // 0-100
  confidence_threshold: number // 0-100
  trading_style: 'conservative' | 'balanced' | 'aggressive' | 'analytical' | 'creative'
  preferred_strategies: string[]
  max_position_size: number
  stop_loss_tolerance: number
  profit_taking_style: 'quick' | 'hold' | 'trailing'
}

export default class EnhancedAgentBrain {
  private openai: OpenAI
  private tradingEngine: TradingEngine
  private memory: AgentMemory
  private personality: AgentPersonality
  private agentId: string
  private userId: string
  
  constructor(
    agentId: string,
    userId: string,
    personality: AgentPersonality,
    memory?: AgentMemory
  ) {
    this.agentId = agentId
    this.userId = userId
    this.personality = personality
    this.memory = memory || {
      decisions: [],
      learnings: [],
      marketConditions: [],
      personalityAdjustments: []
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    this.tradingEngine = new TradingEngine({
      apiKey: process.env.BINANCE_API_KEY || '',
      apiSecret: process.env.BINANCE_API_SECRET || '',
      paperTrading: true,
      riskManagement: {
        maxDailyLoss: 1000,
        maxPositionSize: 0.1,
        stopLossPercent: 5,
        takeProfitPercent: 10,
        maxOpenPositions: 5,
        allowedPairs: ['BTCUSDT', 'ETHUSDT', 'ADAUSDT']
      }
    })
  }

  async makeDecision(context: string, marketData?: any): Promise<EnhancedAgentDecision> {
    try {
      // Analyze current market conditions
      const marketAnalysis = await this.analyzeMarket(context, marketData)
      
      // Get trading signals from multiple strategies
      const tradingSignals = await this.getTradingSignals(marketData)
      
      // Apply personality-based decision making
      const decision = await this.generateDecision(context, marketAnalysis, tradingSignals)
      
      // Learn from past decisions
      this.updateLearnings(decision, marketAnalysis)
      
      // Notify via WebSocket
      this.notifyDecision(decision)
      
      return decision
      
    } catch (error) {
      console.error('Error in enhanced decision making:', error)
      return this.getFallbackDecision(context)
    }
  }

  private async analyzeMarket(context: string, marketData?: any): Promise<EnhancedAgentDecision['marketAnalysis']> {
    if (!marketData) {
      return {
        technicalIndicators: {},
        sentiment: 'neutral',
        riskFactors: [],
        opportunities: []
      }
    }

    try {
      // Calculate technical indicators
      const rsi = await this.tradingEngine.calculateRSI(marketData.symbol, 14)
      const trend = await this.tradingEngine.getTrendDirection(marketData.symbol)
      const price = await this.tradingEngine.getCurrentPrice(marketData.symbol)
      
      const technicalIndicators = {
        rsi,
        price,
        change24h: marketData.change24h || 0,
        volume24h: marketData.volume24h || 0
      }
      
      // Determine sentiment
      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
      if (rsi > 60 && trend === 'BULLISH' && marketData.change24h > 2) {
        sentiment = 'bullish'
      } else if (rsi < 40 && trend === 'BEARISH' && marketData.change24h < -2) {
        sentiment = 'bearish'
      }
      
      // Identify risk factors
      const riskFactors = []
      if (rsi > 80) riskFactors.push('Overbought conditions')
      if (rsi < 20) riskFactors.push('Oversold conditions')
      if (Math.abs(marketData.change24h) > 10) riskFactors.push('High volatility')
      if (marketData.volume24h < marketData.avgVolume * 0.5) riskFactors.push('Low volume')
      
      // Identify opportunities
      const opportunities = []
      if (rsi < 30 && trend !== 'BEARISH') opportunities.push('Potential oversold bounce')
      if (rsi > 70 && trend !== 'BULLISH') opportunities.push('Potential short opportunity')
      if (marketData.volume24h > marketData.avgVolume * 1.5) opportunities.push('High volume breakout potential')
      
      return {
        technicalIndicators,
        sentiment,
        riskFactors,
        opportunities
      }
      
    } catch (error) {
      console.error('Error analyzing market:', error)
      return {
        technicalIndicators: {},
        sentiment: 'neutral',
        riskFactors: ['Market analysis failed'],
        opportunities: []
      }
    }
  }

  private async getTradingSignals(marketData?: any): Promise<TradingSignal[]> {
    if (!marketData?.symbol) return []

    const signals: TradingSignal[] = []
    
    try {
      // Get signals from multiple strategies based on personality
      const strategies = this.getPreferredStrategies()
      
      for (const strategyName of strategies) {
        try {
          const config = StrategyFactory.getDefaultConfig(strategyName, this.getRiskLevel())
          const strategy = StrategyFactory.createStrategy(strategyName, config, this.tradingEngine)
          const signal = await strategy.analyze(marketData.symbol, marketData)
          
          if (signal.confidence > this.personality.confidence_threshold) {
            signals.push(signal)
          }
        } catch (error) {
          console.error(`Error getting ${strategyName} signal:`, error)
        }
      }
      
      return signals
      
    } catch (error) {
      console.error('Error getting trading signals:', error)
      return []
    }
  }

  private async generateDecision(
    context: string,
    marketAnalysis: EnhancedAgentDecision['marketAnalysis'],
    tradingSignals: TradingSignal[]
  ): Promise<EnhancedAgentDecision> {
    try {
      // Prepare context for AI
      const aiContext = this.prepareAIContext(context, marketAnalysis, tradingSignals)
      
      // Get AI recommendation
      const aiResponse = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: aiContext
          }
        ],
        functions: [
          {
            name: 'make_trading_decision',
            description: 'Make a trading decision based on analysis',
            parameters: {
              type: 'object',
              properties: {
                action: { type: 'string', enum: ['BUY', 'SELL', 'HOLD'] },
                confidence: { type: 'number', minimum: 0, maximum: 100 },
                reasoning: { type: 'string' },
                positionSize: { type: 'number', minimum: 0, maximum: 100 },
                expectedOutcome: { type: 'string' }
              },
              required: ['action', 'confidence', 'reasoning', 'positionSize', 'expectedOutcome']
            }
          }
        ],
        function_call: { name: 'make_trading_decision' },
        temperature: 0.7
      })

      const functionCall = aiResponse.choices[0]?.message?.function_call
      if (!functionCall) {
        throw new Error('No function call in AI response')
      }

      const aiDecision = JSON.parse(functionCall.arguments)
      
      // Apply personality adjustments
      const adjustedDecision = this.applyPersonalityAdjustments(aiDecision, tradingSignals)
      
      // Select best trading signal if any
      const bestSignal = this.selectBestTradingSignal(tradingSignals, adjustedDecision.action)
      
      return {
        type: 'trade',
        action: adjustedDecision.action,
        reasoning: adjustedDecision.reasoning,
        confidence: adjustedDecision.confidence,
        riskLevel: this.getRiskLevel(),
        expectedOutcome: adjustedDecision.expectedOutcome,
        tradingSignal: bestSignal,
        parameters: {
          positionSize: adjustedDecision.positionSize,
          strategy: bestSignal?.timeframe || 'manual'
        },
        alternatives: this.generateAlternatives(tradingSignals, adjustedDecision),
        marketAnalysis
      }
      
    } catch (error) {
      console.error('Error generating AI decision:', error)
      return this.getFallbackDecision(context)
    }
  }

  private getSystemPrompt(): string {
    const recentLearnings = this.memory.learnings.slice(-5)
    const recentDecisions = this.memory.decisions.slice(-10)
    
    return `You are an advanced AI trading agent with the following personality:
    - Risk Tolerance: ${this.personality.risk_tolerance}/100
    - Aggression: ${this.personality.aggression}/100
    - Analytical Depth: ${this.personality.analytical_depth}/100
    - Trading Style: ${this.personality.trading_style}
    - Confidence Threshold: ${this.personality.confidence_threshold}/100

    Your trading philosophy: "${this.getTradingPhilosophy()}"

    Recent learnings from past decisions:
    ${recentLearnings.map(l => `- ${l.pattern}: ${l.successRate.toFixed(1)}% success, avg profit ${l.averageProfit.toFixed(2)}`).join('\n')}

    Recent decision performance:
    ${recentDecisions.map(d => `- ${d.decision.action}: ${d.outcome} (${d.profit > 0 ? '+' : ''}${d.profit.toFixed(2)})`).join('\n')}

    Make decisions that align with your personality and learn from past performance.
    Consider all provided market analysis and trading signals.
    Be specific about your reasoning and expected outcomes.`
  }

  private prepareAIContext(
    context: string,
    marketAnalysis: EnhancedAgentDecision['marketAnalysis'],
    tradingSignals: TradingSignal[]
  ): string {
    return `Context: ${context}

Market Analysis:
- Sentiment: ${marketAnalysis?.sentiment}
- Technical Indicators: ${JSON.stringify(marketAnalysis?.technicalIndicators || {})}
- Risk Factors: ${marketAnalysis?.riskFactors?.join(', ') || 'None'}
- Opportunities: ${marketAnalysis?.opportunities?.join(', ') || 'None'}

Trading Signals from Strategies:
${tradingSignals.map(signal => 
  `- ${signal.action} (${signal.confidence}% confidence): ${signal.reason}`
).join('\n') || 'No trading signals available'}

Current Portfolio State:
- Available Balance: $${10000} (demo)
- Open Positions: 0
- Recent Performance: ${this.getRecentPerformance()}

Please analyze this information and make a trading decision that aligns with your personality and maximizes long-term profitability.`
  }

  private applyPersonalityAdjustments(aiDecision: any, tradingSignals: TradingSignal[]): any {
    let adjustedDecision = { ...aiDecision }
    
    // Adjust confidence based on personality
    if (this.personality.risk_tolerance < 30) {
      adjustedDecision.confidence *= 0.8 // More conservative
    } else if (this.personality.risk_tolerance > 70) {
      adjustedDecision.confidence *= 1.2 // More aggressive
      adjustedDecision.confidence = Math.min(100, adjustedDecision.confidence)
    }
    
    // Adjust position size based on personality and risk
    const basePositionSize = adjustedDecision.positionSize
    if (this.personality.trading_style === 'conservative') {
      adjustedDecision.positionSize = Math.min(basePositionSize * 0.5, this.personality.max_position_size * 0.5)
    } else if (this.personality.trading_style === 'aggressive') {
      adjustedDecision.positionSize = Math.min(basePositionSize * 1.5, this.personality.max_position_size)
    }
    
    return adjustedDecision
  }

  private selectBestTradingSignal(signals: TradingSignal[], action: string): TradingSignal | undefined {
    const relevantSignals = signals.filter(signal => signal.action === action)
    if (relevantSignals.length === 0) return undefined
    
    // Select signal with highest confidence that matches personality
    return relevantSignals.reduce((best, current) => {
      if (current.confidence > best.confidence) {
        return current
      }
      return best
    })
  }

  private generateAlternatives(signals: TradingSignal[], mainDecision: any): Array<{action: string, confidence: number, reasoning: string}> {
    const alternatives = []
    
    // Add alternative actions from trading signals
    for (const signal of signals) {
      if (signal.action !== mainDecision.action && signal.confidence > 30) {
        alternatives.push({
          action: signal.action,
          confidence: signal.confidence,
          reasoning: signal.reason
        })
      }
    }
    
    // Add HOLD as always an option
    if (mainDecision.action !== 'HOLD') {
      alternatives.push({
        action: 'HOLD',
        confidence: 50,
        reasoning: 'Wait for better market conditions'
      })
    }
    
    return alternatives.slice(0, 3) // Top 3 alternatives
  }

  private updateLearnings(decision: EnhancedAgentDecision, marketAnalysis: any) {
    // Record decision for future learning
    const decisionRecord: DecisionRecord = {
      timestamp: new Date(),
      context: decision.reasoning,
      decision: { action: decision.action, confidence: decision.confidence },
      outcome: 'neutral', // Will be updated when we know the result
      profit: 0, // Will be updated when we know the result
      confidence: decision.confidence,
      reasoning: decision.reasoning,
      marketConditions: {
        rsi: marketAnalysis?.technicalIndicators?.rsi || 50,
        trend: marketAnalysis?.sentiment || 'neutral',
        volatility: Math.abs(marketAnalysis?.technicalIndicators?.change24h || 0)
      }
    }
    
    this.memory.decisions.push(decisionRecord)
    
    // Keep only last 100 decisions
    if (this.memory.decisions.length > 100) {
      this.memory.decisions = this.memory.decisions.slice(-100)
    }
  }

  private notifyDecision(decision: EnhancedAgentDecision) {
    try {
      // Notify via WebSocket
      webSocketServer.notifyAgentExecution(this.agentId, {
        decision,
        timestamp: new Date(),
        agentId: this.agentId
      })
    } catch (error) {
      console.error('Error notifying decision:', error)
    }
  }

  private getPreferredStrategies(): string[] {
    if (this.personality.preferred_strategies.length > 0) {
      return this.personality.preferred_strategies
    }
    
    // Default strategies based on trading style
    switch (this.personality.trading_style) {
      case 'conservative':
        return ['mean_reversion']
      case 'aggressive':
        return ['momentum', 'breakout']
      case 'analytical':
        return ['momentum', 'mean_reversion', 'breakout']
      default:
        return ['momentum', 'mean_reversion']
    }
  }

  private getRiskLevel(): 'low' | 'medium' | 'high' {
    if (this.personality.risk_tolerance < 40) return 'low'
    if (this.personality.risk_tolerance > 70) return 'high'
    return 'medium'
  }

  private getTradingPhilosophy(): string {
    switch (this.personality.trading_style) {
      case 'conservative':
        return 'Preserve capital first, profit second. Small consistent gains over time.'
      case 'aggressive':
        return 'High risk, high reward. Take advantage of market volatility.'
      case 'analytical':
        return 'Data-driven decisions based on thorough technical analysis.'
      case 'creative':
        return 'Think outside the box, find unique opportunities others miss.'
      default:
        return 'Balanced approach between risk and reward.'
    }
  }

  private getRecentPerformance(): string {
    const recentDecisions = this.memory.decisions.slice(-10)
    if (recentDecisions.length === 0) return 'No recent activity'
    
    const totalProfit = recentDecisions.reduce((sum, d) => sum + d.profit, 0)
    const successRate = recentDecisions.filter(d => d.outcome === 'success').length / recentDecisions.length * 100
    
    return `${successRate.toFixed(1)}% success rate, ${totalProfit > 0 ? '+' : ''}$${totalProfit.toFixed(2)} total`
  }

  private getFallbackDecision(context: string): EnhancedAgentDecision {
    return {
      type: 'trade',
      action: 'HOLD',
      reasoning: 'Fallback decision due to analysis error',
      confidence: 20,
      riskLevel: 'low',
      expectedOutcome: 'Neutral - avoiding risk due to uncertainty',
      parameters: { positionSize: 0 },
      alternatives: []
    }
  }

  // Public methods for updating agent state
  updateDecisionOutcome(decisionId: string, outcome: 'success' | 'failure', profit: number) {
    const decision = this.memory.decisions.find(d => 
      d.timestamp.getTime() === new Date(decisionId).getTime()
    )
    
    if (decision) {
      decision.outcome = outcome
      decision.profit = profit
      
      // Update learnings based on outcome
      this.updatePatternLearning(decision)
    }
  }

  private updatePatternLearning(decision: DecisionRecord) {
    const pattern = `${decision.decision.action}_${decision.marketConditions.trend}_${decision.marketConditions.rsi > 70 ? 'overbought' : decision.marketConditions.rsi < 30 ? 'oversold' : 'neutral'}`
    
    let learning = this.memory.learnings.find(l => l.pattern === pattern)
    if (!learning) {
      learning = {
        pattern,
        condition: `${decision.decision.action} when ${decision.marketConditions.trend} and RSI ${decision.marketConditions.rsi.toFixed(1)}`,
        successRate: 0,
        averageProfit: 0,
        confidence: 50,
        lastUpdated: new Date()
      }
      this.memory.learnings.push(learning)
    }
    
    // Update learning statistics
    const relatedDecisions = this.memory.decisions.filter(d => 
      d.decision.action === decision.decision.action &&
      Math.abs(d.marketConditions.rsi - decision.marketConditions.rsi) < 20
    )
    
    const successes = relatedDecisions.filter(d => d.outcome === 'success').length
    learning.successRate = (successes / relatedDecisions.length) * 100
    learning.averageProfit = relatedDecisions.reduce((sum, d) => sum + d.profit, 0) / relatedDecisions.length
    learning.confidence = Math.min(100, learning.successRate + 10)
    learning.lastUpdated = new Date()
  }

  getMemory(): AgentMemory {
    return this.memory
  }

  getPersonality(): AgentPersonality {
    return this.personality
  }
}