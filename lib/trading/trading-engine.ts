import axios from 'axios'

export interface TradingPair {
  symbol: string
  baseAsset: string
  quoteAsset: string
  status: 'TRADING' | 'BREAK' | 'AUCTION_MATCH'
}

export interface MarketTicker {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  high24h: number
  low24h: number
  timestamp: Date
}

export interface OrderBook {
  symbol: string
  bids: Array<[number, number]> // [price, quantity]
  asks: Array<[number, number]>
  timestamp: Date
}

export interface TradeOrder {
  id: string
  symbol: string
  side: 'BUY' | 'SELL'
  type: 'MARKET' | 'LIMIT' | 'STOP_LOSS'
  quantity: number
  price?: number
  stopPrice?: number
  status: 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELED' | 'REJECTED'
  timestamp: Date
  executedQty: number
  executedPrice?: number
}

export interface Portfolio {
  totalValue: number
  availableBalance: number
  lockedBalance: number
  assets: Array<{
    asset: string
    balance: number
    locked: number
    value: number
  }>
  profitLoss24h: number
  profitLossPercent24h: number
}

export interface RiskManagement {
  maxPositionSize: number // Percentage of portfolio
  stopLossPercent: number
  takeProfitPercent: number
  maxDailyLoss: number
  maxOpenPositions: number
  allowedPairs: string[]
}

class TradingEngine {
  private apiKey: string
  private apiSecret: string
  private baseUrl: string
  private paperTrading: boolean
  private paperPortfolio: Portfolio
  private riskManagement: RiskManagement
  private rateLimitDelay: number = 100 // ms between API calls

  constructor(
    config: {
      apiKey: string
      apiSecret: string
      paperTrading?: boolean
      riskManagement: RiskManagement
    }
  ) {
    this.apiKey = config.apiKey
    this.apiSecret = config.apiSecret
    this.baseUrl = 'https://api.binance.com/api/v3'
    this.paperTrading = config.paperTrading ?? true
    this.riskManagement = config.riskManagement
    
    // Initialize paper trading portfolio
    this.paperPortfolio = {
      totalValue: 10000, // Start with $10k
      availableBalance: 10000,
      lockedBalance: 0,
      assets: [
        { asset: 'USDT', balance: 10000, locked: 0, value: 10000 }
      ],
      profitLoss24h: 0,
      profitLossPercent24h: 0
    }
  }

  async getMarketData(symbols: string[]): Promise<MarketTicker[]> {
    try {
      await this.rateLimitWait()
      
      const response = await axios.get(`${this.baseUrl}/ticker/24hr`)
      const allTickers = response.data
      
      return allTickers
        .filter((ticker: any) => symbols.includes(ticker.symbol))
        .map((ticker: any) => ({
          symbol: ticker.symbol,
          price: parseFloat(ticker.lastPrice),
          change24h: parseFloat(ticker.priceChangePercent),
          volume24h: parseFloat(ticker.volume),
          high24h: parseFloat(ticker.highPrice),
          low24h: parseFloat(ticker.lowPrice),
          timestamp: new Date()
        }))
    } catch (error) {
      console.error('Error fetching market data:', error)
      throw new Error('Failed to fetch market data')
    }
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    try {
      await this.rateLimitWait()
      
      const response = await axios.get(`${this.baseUrl}/depth`, {
        params: { symbol, limit }
      })
      
      return {
        symbol,
        bids: response.data.bids.map((bid: string[]) => [parseFloat(bid[0]), parseFloat(bid[1])]),
        asks: response.data.asks.map((ask: string[]) => [parseFloat(ask[0]), parseFloat(ask[1])]),
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Error fetching order book:', error)
      throw new Error('Failed to fetch order book')
    }
  }

  async executeOrder(order: Omit<TradeOrder, 'id' | 'status' | 'timestamp' | 'executedQty' | 'executedPrice'>): Promise<TradeOrder> {
    // Validate order against risk management
    const validation = await this.validateOrder(order)
    if (!validation.valid) {
      throw new Error(`Order validation failed: ${validation.reason}`)
    }

    const tradeOrder: TradeOrder = {
      id: this.generateOrderId(),
      ...order,
      status: 'NEW',
      timestamp: new Date(),
      executedQty: 0
    }

    if (this.paperTrading) {
      return this.executePaperTrade(tradeOrder)
    } else {
      return this.executeRealTrade(tradeOrder)
    }
  }

  private async validateOrder(order: any): Promise<{ valid: boolean; reason?: string }> {
    // Check if pair is allowed
    if (!this.riskManagement.allowedPairs.includes(order.symbol)) {
      return { valid: false, reason: 'Trading pair not allowed' }
    }

    // Get current portfolio
    const portfolio = await this.getPortfolio()
    
    // Calculate position size as percentage of portfolio
    const orderValue = order.quantity * (order.price || await this.getCurrentPrice(order.symbol))
    const positionSizePercent = (orderValue / portfolio.totalValue) * 100
    
    if (positionSizePercent > this.riskManagement.maxPositionSize) {
      return { valid: false, reason: 'Position size exceeds maximum allowed' }
    }

    // Check available balance
    if (order.side === 'BUY' && orderValue > portfolio.availableBalance) {
      return { valid: false, reason: 'Insufficient balance' }
    }

    // Check maximum open positions
    const openPositions = await this.getOpenPositions()
    if (openPositions.length >= this.riskManagement.maxOpenPositions) {
      return { valid: false, reason: 'Maximum open positions reached' }
    }

    // Check daily loss limit
    if (portfolio.profitLoss24h < -this.riskManagement.maxDailyLoss) {
      return { valid: false, reason: 'Daily loss limit reached' }
    }

    return { valid: true }
  }

  private async executePaperTrade(order: TradeOrder): Promise<TradeOrder> {
    try {
      const currentPrice = await this.getCurrentPrice(order.symbol)
      const executionPrice = order.type === 'MARKET' ? currentPrice : (order.price || currentPrice)
      
      // Simulate slippage for market orders
      const slippage = order.type === 'MARKET' ? this.calculateSlippage(order.quantity, order.symbol) : 0
      const finalPrice = executionPrice * (1 + (order.side === 'BUY' ? slippage : -slippage))
      
      // Update paper portfolio
      this.updatePaperPortfolio(order, finalPrice)
      
      order.status = 'FILLED'
      order.executedQty = order.quantity
      order.executedPrice = finalPrice
      
      console.log(`Paper trade executed: ${order.side} ${order.quantity} ${order.symbol} at $${finalPrice}`)
      
      return order
    } catch (error) {
      order.status = 'REJECTED'
      console.error('Paper trade execution failed:', error)
      return order
    }
  }

  private updatePaperPortfolio(order: TradeOrder, price: number) {
    const [baseAsset, quoteAsset] = order.symbol.replace('USDT', ' USDT').split(' ')
    const orderValue = order.quantity * price
    
    if (order.side === 'BUY') {
      // Remove quote asset (USDT)
      const usdtAsset = this.paperPortfolio.assets.find(a => a.asset === quoteAsset)
      if (usdtAsset) {
        usdtAsset.balance -= orderValue
        usdtAsset.value = usdtAsset.balance
      }
      
      // Add base asset
      let baseAssetObj = this.paperPortfolio.assets.find(a => a.asset === baseAsset)
      if (!baseAssetObj) {
        baseAssetObj = { asset: baseAsset, balance: 0, locked: 0, value: 0 }
        this.paperPortfolio.assets.push(baseAssetObj)
      }
      baseAssetObj.balance += order.quantity
      baseAssetObj.value = baseAssetObj.balance * price
    } else {
      // Remove base asset
      const baseAssetObj = this.paperPortfolio.assets.find(a => a.asset === baseAsset)
      if (baseAssetObj) {
        baseAssetObj.balance -= order.quantity
        baseAssetObj.value = baseAssetObj.balance * price
      }
      
      // Add quote asset (USDT)
      const usdtAsset = this.paperPortfolio.assets.find(a => a.asset === quoteAsset)
      if (usdtAsset) {
        usdtAsset.balance += orderValue
        usdtAsset.value = usdtAsset.balance
      }
    }
    
    // Update total values
    this.paperPortfolio.totalValue = this.paperPortfolio.assets.reduce((sum, asset) => sum + asset.value, 0)
    this.paperPortfolio.availableBalance = this.paperPortfolio.assets.find(a => a.asset === 'USDT')?.balance || 0
  }

  private async executeRealTrade(order: TradeOrder): Promise<TradeOrder> {
    // This would implement real trading via Binance API
    // For production, you'd need proper authentication, signatures, etc.
    throw new Error('Real trading not implemented in demo - use paper trading mode')
  }

  private calculateSlippage(quantity: number, symbol: string): number {
    // Simple slippage model - in production, use order book analysis
    const baseSlippage = 0.001 // 0.1%
    const quantityFactor = Math.min(quantity / 1000, 0.01) // More slippage for larger orders
    return baseSlippage + quantityFactor
  }

  async getPortfolio(): Promise<Portfolio> {
    if (this.paperTrading) {
      return { ...this.paperPortfolio }
    } else {
      // Would fetch real portfolio from exchange
      throw new Error('Real portfolio fetching not implemented')
    }
  }

  async getOpenPositions(): Promise<TradeOrder[]> {
    // In paper trading, we'd maintain this in memory or database
    // For real trading, fetch from exchange
    return []
  }

  async getCurrentPrice(symbol: string): Promise<number> {
    try {
      await this.rateLimitWait()
      
      const response = await axios.get(`${this.baseUrl}/ticker/price`, {
        params: { symbol }
      })
      
      return parseFloat(response.data.price)
    } catch (error) {
      console.error('Error fetching current price:', error)
      throw new Error('Failed to fetch current price')
    }
  }

  // Technical analysis helpers
  async calculateRSI(symbol: string, period: number = 14): Promise<number> {
    try {
      await this.rateLimitWait()
      
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: {
          symbol,
          interval: '1h',
          limit: period + 1
        }
      })
      
      const prices = response.data.map((kline: any) => parseFloat(kline[4])) // Close prices
      return this.calculateRSIFromPrices(prices, period)
    } catch (error) {
      console.error('Error calculating RSI:', error)
      return 50 // Neutral RSI on error
    }
  }

  private calculateRSIFromPrices(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50
    
    let gains = 0
    let losses = 0
    
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) {
        gains += change
      } else {
        losses += Math.abs(change)
      }
    }
    
    const avgGain = gains / period
    const avgLoss = losses / period
    
    if (avgLoss === 0) return 100
    
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  async getTrendDirection(symbol: string): Promise<'BULLISH' | 'BEARISH' | 'SIDEWAYS'> {
    try {
      await this.rateLimitWait()
      
      const response = await axios.get(`${this.baseUrl}/klines`, {
        params: {
          symbol,
          interval: '1h',
          limit: 50
        }
      })
      
      const prices = response.data.map((kline: any) => parseFloat(kline[4]))
      const sma20 = this.calculateSMA(prices.slice(-20), 20)
      const sma50 = this.calculateSMA(prices, 50)
      const currentPrice = prices[prices.length - 1]
      
      if (currentPrice > sma20 && sma20 > sma50) {
        return 'BULLISH'
      } else if (currentPrice < sma20 && sma20 < sma50) {
        return 'BEARISH'
      } else {
        return 'SIDEWAYS'
      }
    } catch (error) {
      console.error('Error determining trend:', error)
      return 'SIDEWAYS'
    }
  }

  private calculateSMA(prices: number[], period: number): number {
    const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0)
    return sum / period
  }

  private async rateLimitWait() {
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay))
  }

  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Risk management methods
  calculatePositionSize(portfolioValue: number, riskPercent: number, entryPrice: number, stopLoss: number): number {
    const riskAmount = portfolioValue * (riskPercent / 100)
    const riskPerShare = Math.abs(entryPrice - stopLoss)
    return Math.floor(riskAmount / riskPerShare)
  }

  calculateStopLoss(entryPrice: number, side: 'BUY' | 'SELL', stopPercent: number): number {
    if (side === 'BUY') {
      return entryPrice * (1 - stopPercent / 100)
    } else {
      return entryPrice * (1 + stopPercent / 100)
    }
  }

  calculateTakeProfit(entryPrice: number, side: 'BUY' | 'SELL', profitPercent: number): number {
    if (side === 'BUY') {
      return entryPrice * (1 + profitPercent / 100)
    } else {
      return entryPrice * (1 - profitPercent / 100)
    }
  }

  // Performance tracking
  getPerformanceMetrics(): {
    totalTrades: number
    winRate: number
    avgProfit: number
    sharpeRatio: number
    maxDrawdown: number
  } {
    // This would be calculated from trade history
    // For demo purposes, return mock data
    return {
      totalTrades: 0,
      winRate: 0,
      avgProfit: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    }
  }

  setPaperTradingMode(enabled: boolean) {
    this.paperTrading = enabled
  }

  updateRiskManagement(newRiskManagement: Partial<RiskManagement>) {
    this.riskManagement = { ...this.riskManagement, ...newRiskManagement }
  }

  async getMarketSentiment(symbol: string): Promise<'FEAR' | 'GREED' | 'NEUTRAL'> {
    // This could integrate with Fear & Greed Index or social sentiment APIs
    // For now, return neutral
    return 'NEUTRAL'
  }
}

export default TradingEngine