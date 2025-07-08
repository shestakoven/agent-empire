import OpenAI from 'openai'

export interface AgentMemory {
  recentDecisions: Array<{
    timestamp: Date
    decision: string
    outcome: 'success' | 'failure' | 'pending'
    context: any
  }>
  learnings: string[]
  performanceMetrics: {
    successRate: number
    totalDecisions: number
    avgProfit: number
  }
}

export interface AgentPersonality {
  riskTolerance: 'low' | 'medium' | 'high'
  decisionSpeed: 'slow' | 'medium' | 'fast'
  learningRate: 'conservative' | 'adaptive' | 'aggressive'
  creativity: number // 0-10
  analyticalDepth: number // 0-10
}

export interface MarketData {
  symbol: string
  price: number
  change24h: number
  volume: number
  timestamp: Date
}

export interface AgentDecision {
  type: 'trade' | 'content' | 'task'
  action: string
  confidence: number
  reasoning: string
  parameters: any
  expectedOutcome: string
}

class AgentBrain {
  private openai: OpenAI
  private memory: AgentMemory
  private personality: AgentPersonality
  private agentType: string

  constructor(
    personality: AgentPersonality,
    agentType: string,
    initialMemory?: AgentMemory
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    this.personality = personality
    this.agentType = agentType
    this.memory = initialMemory || {
      recentDecisions: [],
      learnings: [],
      performanceMetrics: {
        successRate: 0,
        totalDecisions: 0,
        avgProfit: 0
      }
    }
  }

  async makeDecision(
    context: {
      marketData?: MarketData[]
      portfolio?: any
      socialMetrics?: any
      tasks?: any[]
      timeframe?: string
    }
  ): Promise<AgentDecision> {
    try {
      const prompt = this.buildDecisionPrompt(context)
      
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.getSystemPrompt()
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        functions: this.getFunctionDefinitions(),
        function_call: "auto",
        temperature: this.personality.creativity / 10,
        max_tokens: 500
      })

      const decision = this.parseAIResponse(response)
      this.recordDecision(decision, context)
      
      return decision
    } catch (error) {
      console.error('Error making AI decision:', error)
      return this.fallbackDecision(context)
    }
  }

  private getSystemPrompt(): string {
    const personalityTraits = `
Risk Tolerance: ${this.personality.riskTolerance}
Decision Speed: ${this.personality.decisionSpeed}  
Learning Rate: ${this.personality.learningRate}
Creativity: ${this.personality.creativity}/10
Analytical Depth: ${this.personality.analyticalDepth}/10
    `.trim()

    const recentPerformance = `
Success Rate: ${this.memory.performanceMetrics.successRate}%
Total Decisions: ${this.memory.performanceMetrics.totalDecisions}
Average Profit: $${this.memory.performanceMetrics.avgProfit}
    `.trim()

    const recentLearnings = this.memory.learnings.slice(-3).join('\n- ')

    return `You are an AI agent specialized in ${this.agentType}. 

PERSONALITY TRAITS:
${personalityTraits}

RECENT PERFORMANCE:
${recentPerformance}

RECENT LEARNINGS:
- ${recentLearnings}

Your goal is to make intelligent decisions that maximize profit while managing risk according to your personality. Always provide clear reasoning for your decisions and consider the context carefully.

${this.getTypeSpecificInstructions()}
    `.trim()
  }

  private getTypeSpecificInstructions(): string {
    switch (this.agentType) {
      case 'trading':
        return `
TRADING INSTRUCTIONS:
- Analyze market trends, volume, and price action
- Consider risk management and position sizing
- Look for high-probability setups based on your risk tolerance
- Never risk more than recommended position size
- Use stop-losses and take-profit levels
- Consider market sentiment and news impact
        `.trim()
        
      case 'content':
        return `
CONTENT CREATION INSTRUCTIONS:
- Generate engaging, viral-worthy content
- Consider current trends and hashtags
- Match the tone to the target audience
- Optimize for platform-specific best practices
- Focus on value-driven content that builds following
- Track engagement metrics and optimize accordingly
        `.trim()
        
      case 'automation':
        return `
TASK AUTOMATION INSTRUCTIONS:
- Prioritize tasks by impact and urgency
- Look for patterns that can be automated
- Optimize workflows for efficiency
- Consider resource constraints and deadlines
- Focus on high-value activities
- Learn from previous task outcomes
        `.trim()
        
      default:
        return 'Make decisions that align with your assigned role and maximize value creation.'
    }
  }

  private getFunctionDefinitions() {
    const baseFunctions = [
      {
        name: "analyze_situation",
        description: "Analyze the current situation and market conditions",
        parameters: {
          type: "object",
          properties: {
            analysis: { type: "string" },
            opportunities: { type: "array", items: { type: "string" } },
            risks: { type: "array", items: { type: "string" } },
            confidence: { type: "number", minimum: 0, maximum: 100 }
          }
        }
      }
    ]

    switch (this.agentType) {
      case 'trading':
        return [...baseFunctions, {
          name: "execute_trade",
          description: "Execute a trading decision",
          parameters: {
            type: "object",
            properties: {
              action: { type: "string", enum: ["buy", "sell", "hold"] },
              symbol: { type: "string" },
              amount: { type: "number" },
              reasoning: { type: "string" },
              stopLoss: { type: "number" },
              takeProfit: { type: "number" },
              confidence: { type: "number", minimum: 0, maximum: 100 }
            }
          }
        }]
        
      case 'content':
        return [...baseFunctions, {
          name: "create_content",
          description: "Create social media content",
          parameters: {
            type: "object",
            properties: {
              platform: { type: "string", enum: ["twitter", "instagram", "tiktok", "linkedin"] },
              content: { type: "string" },
              hashtags: { type: "array", items: { type: "string" } },
              contentType: { type: "string", enum: ["text", "image", "video", "poll"] },
              reasoning: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 100 }
            }
          }
        }]
        
      case 'automation':
        return [...baseFunctions, {
          name: "automate_task",
          description: "Automate a specific task",
          parameters: {
            type: "object",
            properties: {
              taskType: { type: "string" },
              action: { type: "string" },
              parameters: { type: "object" },
              schedule: { type: "string" },
              reasoning: { type: "string" },
              confidence: { type: "number", minimum: 0, maximum: 100 }
            }
          }
        }]
        
      default:
        return baseFunctions
    }
  }

  private buildDecisionPrompt(context: any): string {
    let prompt = `Current context for decision making:\n\n`
    
    if (context.marketData) {
      prompt += `Market Data:\n`
      context.marketData.forEach((data: MarketData) => {
        prompt += `- ${data.symbol}: $${data.price} (${data.change24h > 0 ? '+' : ''}${data.change24h}%)\n`
      })
      prompt += `\n`
    }
    
    if (context.portfolio) {
      prompt += `Portfolio:\n- Balance: $${context.portfolio.balance}\n- Holdings: ${JSON.stringify(context.portfolio.holdings)}\n\n`
    }
    
    if (context.socialMetrics) {
      prompt += `Social Metrics:\n- Followers: ${context.socialMetrics.followers}\n- Engagement: ${context.socialMetrics.engagement}\n\n`
    }
    
    if (context.timeframe) {
      prompt += `Timeframe: ${context.timeframe}\n\n`
    }
    
    prompt += `Based on this information and your personality traits, what decision should you make? Consider your recent performance and learnings.`
    
    return prompt
  }

  private parseAIResponse(response: any): AgentDecision {
    const message = response.choices[0].message
    
    if (message.function_call) {
      const functionName = message.function_call.name
      const args = JSON.parse(message.function_call.arguments)
      
      return {
        type: this.getDecisionTypeFromFunction(functionName),
        action: args.action || functionName,
        confidence: args.confidence || 75,
        reasoning: args.reasoning || message.content || 'AI decision based on analysis',
        parameters: args,
        expectedOutcome: this.generateExpectedOutcome(args)
      }
    }
    
    // Fallback to content-based parsing
    return {
      type: this.agentType as any,
      action: 'analyze',
      confidence: 50,
      reasoning: message.content || 'General analysis',
      parameters: {},
      expectedOutcome: 'Analysis completed'
    }
  }

  private getDecisionTypeFromFunction(functionName: string): 'trade' | 'content' | 'task' {
    if (functionName.includes('trade')) return 'trade'
    if (functionName.includes('content')) return 'content'
    return 'task'
  }

  private generateExpectedOutcome(parameters: any): string {
    if (parameters.action === 'buy' || parameters.action === 'sell') {
      return `Expected ${parameters.action} of ${parameters.symbol} for potential profit`
    }
    if (parameters.content) {
      return `Expected engagement boost from ${parameters.platform} content`
    }
    return 'Expected positive outcome from automated task'
  }

  private recordDecision(decision: AgentDecision, context: any) {
    this.memory.recentDecisions.push({
      timestamp: new Date(),
      decision: `${decision.action}: ${decision.reasoning}`,
      outcome: 'pending',
      context
    })
    
    // Keep only last 20 decisions
    if (this.memory.recentDecisions.length > 20) {
      this.memory.recentDecisions = this.memory.recentDecisions.slice(-20)
    }
    
    this.memory.performanceMetrics.totalDecisions++
  }

  private fallbackDecision(context: any): AgentDecision {
    return {
      type: this.agentType as any,
      action: 'hold',
      confidence: 30,
      reasoning: 'AI service unavailable, maintaining safe position',
      parameters: { fallback: true },
      expectedOutcome: 'Maintain current position safely'
    }
  }

  async updateMemoryWithOutcome(
    decisionId: number,
    outcome: 'success' | 'failure',
    metrics?: { profit?: number; engagement?: number }
  ) {
    if (this.memory.recentDecisions[decisionId]) {
      this.memory.recentDecisions[decisionId].outcome = outcome
      
      if (outcome === 'success') {
        this.memory.performanceMetrics.successRate = 
          (this.memory.performanceMetrics.successRate * (this.memory.performanceMetrics.totalDecisions - 1) + 100) / 
          this.memory.performanceMetrics.totalDecisions
          
        if (metrics?.profit) {
          this.memory.performanceMetrics.avgProfit = 
            (this.memory.performanceMetrics.avgProfit + metrics.profit) / 2
        }
      }
      
      // Learn from the outcome
      const learning = this.generateLearning(this.memory.recentDecisions[decisionId], outcome, metrics)
      if (learning) {
        this.memory.learnings.push(learning)
        if (this.memory.learnings.length > 10) {
          this.memory.learnings = this.memory.learnings.slice(-10)
        }
      }
    }
  }

  private generateLearning(decision: any, outcome: string, metrics?: any): string {
    if (outcome === 'success' && metrics?.profit > 50) {
      return `High-profit decision: ${decision.decision} - continue similar strategies`
    }
    if (outcome === 'failure') {
      return `Failed decision: ${decision.decision} - avoid similar patterns`
    }
    return ''
  }

  getMemory(): AgentMemory {
    return { ...this.memory }
  }

  updatePersonality(updates: Partial<AgentPersonality>) {
    this.personality = { ...this.personality, ...updates }
  }
}

export default AgentBrain