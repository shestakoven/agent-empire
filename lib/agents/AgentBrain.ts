import OpenAI from 'openai'

export interface AgentConfig {
  agentId: string
  name: string
  type: string
  personality: string
  goals: string[]
  riskTolerance: number
  maxBudget: number
}

export interface AgentDecision {
  action: string
  parameters: any
  reasoning: string
  confidence: number
}

export interface AgentMemory {
  conversations: string[]
  trades: any[]
  posts: any[]
  learnings: string[]
  performance: {
    totalEarnings: number
    successRate: number
    riskScore: number
  }
}

export class AgentBrain {
  private openai: OpenAI
  private memory: AgentMemory
  private personality: string
  private goals: string[]
  public name: string

  constructor(config: AgentConfig) {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    })
    this.personality = config.personality
    this.goals = config.goals
    this.name = config.name
    this.memory = this.initializeMemory()
  }

  private initializeMemory(): AgentMemory {
    return {
      conversations: [],
      trades: [],
      posts: [],
      learnings: [],
      performance: {
        totalEarnings: 0,
        successRate: 0,
        riskScore: 0.5
      }
    }
  }

  async think(situation: string, context: any): Promise<AgentDecision> {
    try {
      const systemPrompt = this.buildSystemPrompt()
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: `Situation: ${situation}\nContext: ${JSON.stringify(context, null, 2)}` 
          }
        ],
        functions: this.getAvailableFunctions(),
        function_call: "auto",
        temperature: 0.7
      })

      return this.parseDecision(completion)
    } catch (error) {
      console.error('AgentBrain thinking error:', error)
      return {
        action: 'wait',
        parameters: {},
        reasoning: 'Error occurred during decision making',
        confidence: 0
      }
    }
  }

  private buildSystemPrompt(): string {
    return `You are ${this.name}, an AI agent with the following characteristics:

Personality: ${this.personality}
Goals: ${this.goals.join(', ')}
Current Performance: 
- Total Earnings: $${this.memory.performance.totalEarnings}
- Success Rate: ${this.memory.performance.successRate}%
- Risk Score: ${this.memory.performance.riskScore}

You can:
- Trade cryptocurrency (buy/sell/analyze markets)
- Create social media content (posts, tweets, etc.)
- Automate tasks (research, analysis, etc.)
- Learn from past experiences

Always consider:
1. Risk management - never exceed your risk tolerance
2. Goal achievement - work towards your defined objectives  
3. Learning opportunities - improve from each action
4. Ethical considerations - be honest and helpful

Recent learnings: ${this.memory.learnings.slice(-3).join(', ')}

Respond with specific, actionable decisions. Be decisive but careful.`
  }

  private getAvailableFunctions() {
    return [
      {
        name: "execute_trade",
        description: "Execute a cryptocurrency trade",
        parameters: {
          type: "object",
          properties: {
            action: { 
              type: "string", 
              enum: ["buy", "sell", "hold"],
              description: "Trading action to take"
            },
            symbol: { 
              type: "string",
              description: "Trading pair symbol (e.g., BTC/USDT)"
            },
            amount: { 
              type: "number",
              description: "Amount to trade in USD"
            },
            reasoning: { 
              type: "string",
              description: "Explanation for this trade decision"
            }
          },
          required: ["action", "symbol", "amount", "reasoning"]
        }
      },
      {
        name: "create_content",
        description: "Generate and post social media content",
        parameters: {
          type: "object", 
          properties: {
            platform: { 
              type: "string", 
              enum: ["twitter", "tiktok", "instagram"],
              description: "Social media platform"
            },
            content_type: { 
              type: "string", 
              enum: ["text", "image", "video"],
              description: "Type of content to create"
            },
            topic: { 
              type: "string",
              description: "Topic or theme for the content"
            },
            tone: { 
              type: "string",
              description: "Tone of voice for the content"
            }
          },
          required: ["platform", "content_type", "topic", "tone"]
        }
      },
      {
        name: "automate_task",
        description: "Execute an automation task",
        parameters: {
          type: "object",
          properties: {
            task_type: { 
              type: "string",
              description: "Type of task to automate"
            },
            parameters: { 
              type: "object",
              description: "Task-specific parameters"
            }
          },
          required: ["task_type", "parameters"]
        }
      },
      {
        name: "wait_and_observe",
        description: "Wait and gather more information before acting",
        parameters: {
          type: "object",
          properties: {
            reasoning: {
              type: "string",
              description: "Why waiting is the best action right now"
            },
            duration: {
              type: "number",
              description: "How long to wait in minutes"
            }
          },
          required: ["reasoning"]
        }
      }
    ]
  }

  private parseDecision(completion: any): AgentDecision {
    const message = completion.choices[0].message
    
    if (message.function_call) {
      const functionCall = message.function_call
      let parameters = {}
      
      try {
        parameters = JSON.parse(functionCall.arguments)
      } catch (error) {
        console.error('Error parsing function arguments:', error)
      }
      
      return {
        action: functionCall.name,
        parameters,
        reasoning: (parameters as any).reasoning || 'AI agent decision',
        confidence: 0.8
      }
    }
    
    // Fallback if no function call
    return {
      action: 'wait_and_observe',
      parameters: { reasoning: message.content || 'Analyzing situation' },
      reasoning: message.content || 'Need more information',
      confidence: 0.3
    }
  }

  async updateMemory(decision: AgentDecision, context: any, result?: any) {
    // Add to conversation history
    this.memory.conversations.push(
      `Decision: ${decision.action} - ${decision.reasoning}`
    )
    
    // Update based on decision type
    if (decision.action === 'execute_trade' && result) {
      this.memory.trades.push({
        ...decision.parameters,
        result,
        timestamp: new Date().toISOString()
      })
      
      // Update performance if trade was profitable
      if (result.profit) {
        this.memory.performance.totalEarnings += result.profit
      }
    }
    
    if (decision.action === 'create_content' && result) {
      this.memory.posts.push({
        ...decision.parameters,
        result,
        timestamp: new Date().toISOString()
      })
    }
    
    // Add learning
    if (result?.learning) {
      this.memory.learnings.push(result.learning)
      
      // Keep only last 10 learnings
      if (this.memory.learnings.length > 10) {
        this.memory.learnings = this.memory.learnings.slice(-10)
      }
    }
    
    // Keep conversation history manageable
    if (this.memory.conversations.length > 50) {
      this.memory.conversations = this.memory.conversations.slice(-50)
    }
  }

  getMemory(): AgentMemory {
    return this.memory
  }

  getPerformanceMetrics() {
    return {
      totalEarnings: this.memory.performance.totalEarnings,
      totalTrades: this.memory.trades.length,
      totalPosts: this.memory.posts.length,
      successRate: this.calculateSuccessRate(),
      riskScore: this.memory.performance.riskScore
    }
  }

  private calculateSuccessRate(): number {
    const recentTrades = this.memory.trades.slice(-10)
    if (recentTrades.length === 0) return 0
    
    const profitable = recentTrades.filter(trade => 
      trade.result?.profit && trade.result.profit > 0
    ).length
    
    return (profitable / recentTrades.length) * 100
  }
}