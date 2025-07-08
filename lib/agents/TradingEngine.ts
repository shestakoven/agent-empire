export interface TradeParams {
  action: 'buy' | 'sell' | 'hold'
  symbol: string
  amount: number
  reasoning: string
}

export interface TradeResult {
  success: boolean
  orderId?: string
  executedPrice?: number
  amount?: number
  fee?: number
  profit?: number
  error?: string
  timestamp?: number
}

export interface MarketData {
  price: number
  volume: number
  change24h: number
  bid: number
  ask: number
  timestamp: number
}

export class TradingEngine {
  private riskTolerance: number
  private maxBudget: number
  private paperTrading: boolean = true // Start with paper trading for safety
  private portfolio: Map<string, number> = new Map() // symbol -> amount owned
  private cash: number = 10000 // Starting cash for paper trading

  constructor(config: any) {
    this.riskTolerance = config.riskTolerance || 0.1
    this.maxBudget = config.maxBudget || 1000
    
    // Initialize portfolio
    this.portfolio.set('USDT', this.cash)
  }

  async getMarketData(symbol: string = 'BTC/USDT'): Promise<MarketData> {
    try {
      // For demo, use a public API to get real market data
      const response = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol.replace('/', '')}`
      )
      const data = await response.json()
      
      return {
        price: parseFloat(data.lastPrice),
        volume: parseFloat(data.volume),
        change24h: parseFloat(data.priceChangePercent),
        bid: parseFloat(data.bidPrice),
        ask: parseFloat(data.askPrice),
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Error fetching market data:', error)
      
      // Fallback with simulated data
      return {
        price: 45000 + (Math.random() - 0.5) * 1000, // Simulate BTC price
        volume: 1000000,
        change24h: (Math.random() - 0.5) * 10,
        bid: 44950,
        ask: 45050,
        timestamp: Date.now()
      }
    }
  }

  async executeTrade(params: TradeParams): Promise<TradeResult> {
    try {
      // Risk checks
      if (params.amount > this.maxBudget * this.riskTolerance) {
        return {
          success: false,
          error: `Trade amount $${params.amount} exceeds risk tolerance (max: $${this.maxBudget * this.riskTolerance})`
        }
      }

      // Get current market data
      const marketData = await this.getMarketData(params.symbol)
      
      if (this.paperTrading) {
        return await this.executePaperTrade(params, marketData)
      } else {
        return await this.executeRealTrade(params, marketData)
      }

    } catch (error) {
      console.error('Trade execution failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown trading error'
      }
    }
  }

  private async executePaperTrade(params: TradeParams, marketData: MarketData): Promise<TradeResult> {
    const { action, symbol, amount } = params
    const [baseSymbol, quoteSymbol] = symbol.split('/')
    const price = marketData.price
    
    // Add some slippage simulation
    const slippage = 0.001 // 0.1% slippage
    const executionPrice = action === 'buy' 
      ? price * (1 + slippage) 
      : price * (1 - slippage)
    
    let success = false
    let profit = 0

    if (action === 'buy') {
      const usdtBalance = this.portfolio.get(quoteSymbol) || 0
      if (usdtBalance >= amount) {
        const cryptoAmount = amount / executionPrice
        const fee = amount * 0.001 // 0.1% fee
        
        // Update portfolio
        this.portfolio.set(quoteSymbol, usdtBalance - amount - fee)
        this.portfolio.set(baseSymbol, (this.portfolio.get(baseSymbol) || 0) + cryptoAmount)
        
        success = true
        console.log(`📈 Paper Trade: Bought ${cryptoAmount.toFixed(6)} ${baseSymbol} for $${amount} at $${executionPrice.toFixed(2)}`)
      } else {
        return {
          success: false,
          error: `Insufficient balance. Have $${usdtBalance.toFixed(2)}, need $${amount}`
        }
      }
    } else if (action === 'sell') {
      const cryptoBalance = this.portfolio.get(baseSymbol) || 0
      const cryptoToSell = amount / executionPrice
      
      if (cryptoBalance >= cryptoToSell) {
        const usdReceived = cryptoToSell * executionPrice
        const fee = usdReceived * 0.001 // 0.1% fee
        
        // Calculate profit (simplified)
        profit = usdReceived - amount // This is a simplified calculation
        
        // Update portfolio
        this.portfolio.set(baseSymbol, cryptoBalance - cryptoToSell)
        this.portfolio.set(quoteSymbol, (this.portfolio.get(quoteSymbol) || 0) + usdReceived - fee)
        
        success = true
        console.log(`📉 Paper Trade: Sold ${cryptoToSell.toFixed(6)} ${baseSymbol} for $${usdReceived.toFixed(2)} at $${executionPrice.toFixed(2)}`)
        console.log(`💰 Profit: $${profit.toFixed(2)}`)
      } else {
        return {
          success: false,
          error: `Insufficient ${baseSymbol} balance. Have ${cryptoBalance.toFixed(6)}, need ${cryptoToSell.toFixed(6)}`
        }
      }
    } else {
      // Hold action
      return {
        success: true,
        executedPrice: price,
        amount: 0,
        profit: 0,
        timestamp: Date.now()
      }
    }

    return {
      success,
      orderId: `paper_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      executedPrice: executionPrice,
      amount: action === 'buy' ? amount / executionPrice : amount,
      fee: amount * 0.001,
      profit,
      timestamp: Date.now()
    }
  }

  private async executeRealTrade(params: TradeParams, marketData: MarketData): Promise<TradeResult> {
    // TODO: Implement real trading with actual exchange APIs
    // This would use libraries like 'ccxt' to connect to Binance, Coinbase, etc.
    
    console.warn('🚨 Real trading not implemented yet. Use paper trading for testing.')
    
    return {
      success: false,
      error: 'Real trading not implemented. Enable paper trading for testing.'
    }
  }

  async analyzeMarket(symbol: string): Promise<any> {
    const marketData = await this.getMarketData(symbol)
    
    // Simple technical analysis
    const analysis = {
      price: marketData.price,
      change24h: marketData.change24h,
      trend: marketData.change24h > 0 ? 'bullish' : 'bearish',
      volatility: Math.abs(marketData.change24h),
      recommendation: this.generateRecommendation(marketData)
    }

    return analysis
  }

  private generateRecommendation(marketData: MarketData): string {
    const change = marketData.change24h
    
    if (change > 5) {
      return 'Strong uptrend - consider taking profits'
    } else if (change > 2) {
      return 'Moderate uptrend - good time to buy'
    } else if (change > -2) {
      return 'Sideways movement - wait for clearer signal'
    } else if (change > -5) {
      return 'Moderate downtrend - potential buying opportunity'
    } else {
      return 'Strong downtrend - avoid buying, consider selling'
    }
  }

  getPortfolio(): Map<string, number> {
    return this.portfolio
  }

  getPortfolioValue(): number {
    // For simplicity, just return USDT balance
    // In real implementation, would calculate total USD value of all holdings
    return this.portfolio.get('USDT') || 0
  }

  enableRealTrading() {
    console.warn('🚨 Enabling real trading! Make sure you have proper API keys and risk management!')
    this.paperTrading = false
  }

  enablePaperTrading() {
    console.log('✅ Paper trading enabled - safe for testing')
    this.paperTrading = true
  }

  isPaperTrading(): boolean {
    return this.paperTrading
  }
}