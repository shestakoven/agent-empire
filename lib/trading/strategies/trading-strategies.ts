import TradingEngine, { MarketTicker, TradeOrder } from '../trading-engine'

export interface TradingSignal {
  action: 'BUY' | 'SELL' | 'HOLD'
  confidence: number // 0-100
  reason: string
  targetPrice?: number
  stopLoss?: number
  takeProfit?: number
  positionSize: number // Percentage of portfolio
  timeframe: string
  indicators: Record<string, number>
}

export interface StrategyConfig {
  name: string
  riskLevel: 'low' | 'medium' | 'high'
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'
  maxPositionSize: number
  stopLossPercent: number
  takeProfitPercent: number
  parameters: Record<string, any>
}

export interface MarketCondition {
  trend: 'bullish' | 'bearish' | 'sideways'
  volatility: 'low' | 'medium' | 'high'
  volume: 'low' | 'medium' | 'high'
  support: number
  resistance: number
}

abstract class BaseTradingStrategy {
  protected config: StrategyConfig
  protected tradingEngine: TradingEngine

  constructor(config: StrategyConfig, tradingEngine: TradingEngine) {
    this.config = config
    this.tradingEngine = tradingEngine
  }

  abstract analyze(
    symbol: string,
    marketData: MarketTicker,
    historicalData?: any[]
  ): Promise<TradingSignal>

  protected calculatePositionSize(
    confidence: number,
    accountBalance: number,
    currentPrice: number,
    stopLoss?: number
  ): number {
    const baseSize = this.config.maxPositionSize
    const confidenceMultiplier = confidence / 100
    const riskMultiplier = this.getRiskMultiplier()
    
    let positionSize = baseSize * confidenceMultiplier * riskMultiplier
    
    // Risk management based on stop loss
    if (stopLoss && currentPrice) {
      const riskPerShare = Math.abs(currentPrice - stopLoss)
      const maxRiskAmount = accountBalance * (this.config.stopLossPercent / 100)
      const maxShares = maxRiskAmount / riskPerShare
      const maxPositionValue = maxShares * currentPrice
      const maxPositionPercent = (maxPositionValue / accountBalance) * 100
      
      positionSize = Math.min(positionSize, maxPositionPercent)
    }
    
    return Math.max(0.1, Math.min(positionSize, this.config.maxPositionSize))
  }

  protected getRiskMultiplier(): number {
    switch (this.config.riskLevel) {
      case 'low': return 0.5
      case 'medium': return 1.0
      case 'high': return 1.5
      default: return 1.0
    }
  }

  protected calculateStopLoss(currentPrice: number, action: 'BUY' | 'SELL'): number {
    const stopPercent = this.config.stopLossPercent / 100
    
    if (action === 'BUY') {
      return currentPrice * (1 - stopPercent)
    } else {
      return currentPrice * (1 + stopPercent)
    }
  }

  protected calculateTakeProfit(currentPrice: number, action: 'BUY' | 'SELL'): number {
    const profitPercent = this.config.takeProfitPercent / 100
    
    if (action === 'BUY') {
      return currentPrice * (1 + profitPercent)
    } else {
      return currentPrice * (1 - profitPercent)
    }
  }
}

// Momentum Strategy - Follows strong trends
export class MomentumStrategy extends BaseTradingStrategy {
  async analyze(symbol: string, marketData: MarketTicker): Promise<TradingSignal> {
    try {
      const rsi = await this.tradingEngine.calculateRSI(symbol, 14)
      const trend = await this.tradingEngine.getTrendDirection(symbol)
      const shortMA = await this.calculateMA(symbol, 10)
      const longMA = await this.calculateMA(symbol, 20)
      
      const currentPrice = marketData.price
      const change24h = marketData.change24h
      const volume = marketData.volume24h
      
      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
      let confidence = 0
      let reason = 'No clear momentum signal'
      
      // Strong bullish momentum
      if (
        trend === 'BULLISH' &&
        currentPrice > shortMA &&
        shortMA > longMA &&
        rsi > 50 && rsi < 80 &&
        change24h > 2 &&
        volume > marketData.volume24h * 1.2
      ) {
        action = 'BUY'
        confidence = Math.min(90, 60 + (change24h * 5) + ((80 - rsi) / 2))
        reason = `Strong bullish momentum: ${change24h.toFixed(2)}% gain, RSI ${rsi.toFixed(1)}, trending up`
      }
      
      // Strong bearish momentum
      else if (
        trend === 'BEARISH' &&
        currentPrice < shortMA &&
        shortMA < longMA &&
        rsi < 50 && rsi > 20 &&
        change24h < -2 &&
        volume > marketData.volume24h * 1.2
      ) {
        action = 'SELL'
        confidence = Math.min(90, 60 + (Math.abs(change24h) * 5) + ((rsi - 20) / 2))
        reason = `Strong bearish momentum: ${change24h.toFixed(2)}% loss, RSI ${rsi.toFixed(1)}, trending down`
      }
      
      // Weak signals
      else if (trend === 'BULLISH' && rsi > 40 && rsi < 70) {
        action = 'BUY'
        confidence = 30 + (change24h * 2)
        reason = `Weak bullish signal: trend up, RSI ${rsi.toFixed(1)}`
      }
      
      const positionSize = this.calculatePositionSize(confidence, 10000, currentPrice)
      const stopLoss = action !== 'HOLD' ? this.calculateStopLoss(currentPrice, action) : undefined
      const takeProfit = action !== 'HOLD' ? this.calculateTakeProfit(currentPrice, action) : undefined
      
      return {
        action,
        confidence: Math.max(0, Math.min(100, confidence)),
        reason,
        targetPrice: currentPrice,
        stopLoss,
        takeProfit,
        positionSize,
        timeframe: this.config.timeframe,
        indicators: {
          rsi,
          shortMA,
          longMA,
          change24h,
          volume: volume / 1000000 // In millions
        }
      }
      
    } catch (error) {
      console.error('Error in momentum strategy analysis:', error)
      return this.getDefaultSignal('Error in momentum analysis')
    }
  }

  private async calculateMA(symbol: string, period: number): Promise<number> {
    // This would use historical price data to calculate moving average
    // For demo, we'll use a simplified calculation
    try {
      const currentPrice = await this.tradingEngine.getCurrentPrice(symbol)
      // Simulate MA calculation - in production, use real historical data
      return currentPrice * (0.98 + Math.random() * 0.04)
    } catch {
      return 0
    }
  }

  private getDefaultSignal(reason: string): TradingSignal {
    return {
      action: 'HOLD',
      confidence: 0,
      reason,
      positionSize: 0,
      timeframe: this.config.timeframe,
      indicators: {}
    }
  }
}

// Mean Reversion Strategy - Buys dips, sells peaks
export class MeanReversionStrategy extends BaseTradingStrategy {
  async analyze(symbol: string, marketData: MarketTicker): Promise<TradingSignal> {
    try {
      const rsi = await this.tradingEngine.calculateRSI(symbol, 14)
      const trend = await this.tradingEngine.getTrendDirection(symbol)
      const currentPrice = marketData.price
      const change24h = marketData.change24h
      
      // Calculate Bollinger Bands (simplified)
      const sma20 = await this.calculateMA(symbol, 20)
      const upperBand = sma20 * 1.02 // Simplified: SMA + 2% 
      const lowerBand = sma20 * 0.98 // Simplified: SMA - 2%
      
      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
      let confidence = 0
      let reason = 'No mean reversion signal'
      
      // Oversold conditions - potential buy
      if (
        rsi < 30 &&
        currentPrice < lowerBand &&
        change24h < -3 &&
        trend !== 'BEARISH'
      ) {
        action = 'BUY'
        confidence = Math.min(85, 50 + (30 - rsi) + Math.abs(change24h))
        reason = `Oversold condition: RSI ${rsi.toFixed(1)}, below lower band, ${change24h.toFixed(2)}% down`
      }
      
      // Overbought conditions - potential sell
      else if (
        rsi > 70 &&
        currentPrice > upperBand &&
        change24h > 3 &&
        trend !== 'BULLISH'
      ) {
        action = 'SELL'
        confidence = Math.min(85, 50 + (rsi - 70) + change24h)
        reason = `Overbought condition: RSI ${rsi.toFixed(1)}, above upper band, ${change24h.toFixed(2)}% up`
      }
      
      // Moderate reversion signals
      else if (rsi < 40 && change24h < -1) {
        action = 'BUY'
        confidence = 25 + Math.abs(change24h)
        reason = `Potential oversold: RSI ${rsi.toFixed(1)}, ${change24h.toFixed(2)}% down`
      }
      
      else if (rsi > 60 && change24h > 1) {
        action = 'SELL'
        confidence = 25 + change24h
        reason = `Potential overbought: RSI ${rsi.toFixed(1)}, ${change24h.toFixed(2)}% up`
      }
      
      const positionSize = this.calculatePositionSize(confidence, 10000, currentPrice)
      const stopLoss = action !== 'HOLD' ? this.calculateStopLoss(currentPrice, action) : undefined
      const takeProfit = action !== 'HOLD' ? this.calculateTakeProfit(currentPrice, action) : undefined
      
      return {
        action,
        confidence: Math.max(0, Math.min(100, confidence)),
        reason,
        targetPrice: currentPrice,
        stopLoss,
        takeProfit,
        positionSize,
        timeframe: this.config.timeframe,
        indicators: {
          rsi,
          sma20,
          upperBand,
          lowerBand,
          change24h
        }
      }
      
    } catch (error) {
      console.error('Error in mean reversion strategy analysis:', error)
      return this.getDefaultSignal('Error in mean reversion analysis')
    }
  }

  private async calculateMA(symbol: string, period: number): Promise<number> {
    try {
      const currentPrice = await this.tradingEngine.getCurrentPrice(symbol)
      return currentPrice * (0.99 + Math.random() * 0.02)
    } catch {
      return 0
    }
  }

  private getDefaultSignal(reason: string): TradingSignal {
    return {
      action: 'HOLD',
      confidence: 0,
      reason,
      positionSize: 0,
      timeframe: this.config.timeframe,
      indicators: {}
    }
  }
}

// Breakout Strategy - Trades range breakouts
export class BreakoutStrategy extends BaseTradingStrategy {
  async analyze(symbol: string, marketData: MarketTicker): Promise<TradingSignal> {
    try {
      const currentPrice = marketData.price
      const volume = marketData.volume24h
      const change24h = marketData.change24h
      
      // Calculate support and resistance levels (simplified)
      const high24h = marketData.high24h
      const low24h = marketData.low24h
      const resistance = high24h
      const support = low24h
      const range = resistance - support
      const rangePercent = (range / support) * 100
      
      let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD'
      let confidence = 0
      let reason = 'No breakout signal'
      
      // Bullish breakout above resistance
      if (
        currentPrice > resistance * 1.002 && // 0.2% above resistance
        volume > marketData.volume24h * 1.5 && // High volume
        change24h > 1 &&
        rangePercent > 2 // Minimum 2% range
      ) {
        action = 'BUY'
        confidence = Math.min(90, 40 + change24h * 3 + (volume / marketData.volume24h * 10))
        reason = `Bullish breakout above ${resistance.toFixed(2)}, volume spike ${(volume / marketData.volume24h).toFixed(1)}x`
      }
      
      // Bearish breakdown below support
      else if (
        currentPrice < support * 0.998 && // 0.2% below support
        volume > marketData.volume24h * 1.5 &&
        change24h < -1 &&
        rangePercent > 2
      ) {
        action = 'SELL'
        confidence = Math.min(90, 40 + Math.abs(change24h) * 3 + (volume / marketData.volume24h * 10))
        reason = `Bearish breakdown below ${support.toFixed(2)}, volume spike ${(volume / marketData.volume24h).toFixed(1)}x`
      }
      
      // Pre-breakout signals
      else if (
        currentPrice > resistance * 0.999 &&
        currentPrice < resistance * 1.001 &&
        volume > marketData.volume24h * 1.2
      ) {
        action = 'BUY'
        confidence = 35
        reason = `Approaching resistance ${resistance.toFixed(2)}, increased volume`
      }
      
      else if (
        currentPrice < support * 1.001 &&
        currentPrice > support * 0.999 &&
        volume > marketData.volume24h * 1.2
      ) {
        action = 'SELL'
        confidence = 35
        reason = `Approaching support ${support.toFixed(2)}, increased volume`
      }
      
      const positionSize = this.calculatePositionSize(confidence, 10000, currentPrice)
      const stopLoss = action !== 'HOLD' ? this.calculateStopLoss(currentPrice, action) : undefined
      const takeProfit = action !== 'HOLD' ? this.calculateTakeProfit(currentPrice, action) : undefined
      
      return {
        action,
        confidence: Math.max(0, Math.min(100, confidence)),
        reason,
        targetPrice: currentPrice,
        stopLoss,
        takeProfit,
        positionSize,
        timeframe: this.config.timeframe,
        indicators: {
          resistance,
          support,
          rangePercent,
          volumeRatio: volume / marketData.volume24h,
          change24h
        }
      }
      
    } catch (error) {
      console.error('Error in breakout strategy analysis:', error)
      return this.getDefaultSignal('Error in breakout analysis')
    }
  }

  private getDefaultSignal(reason: string): TradingSignal {
    return {
      action: 'HOLD',
      confidence: 0,
      reason,
      positionSize: 0,
      timeframe: this.config.timeframe,
      indicators: {}
    }
  }
}

// Strategy Factory
export class StrategyFactory {
  static createStrategy(
    strategyName: string,
    config: StrategyConfig,
    tradingEngine: TradingEngine
  ): BaseTradingStrategy {
    switch (strategyName) {
      case 'momentum':
        return new MomentumStrategy(config, tradingEngine)
      case 'mean_reversion':
        return new MeanReversionStrategy(config, tradingEngine)
      case 'breakout':
        return new BreakoutStrategy(config, tradingEngine)
      default:
        throw new Error(`Unknown strategy: ${strategyName}`)
    }
  }

  static getAvailableStrategies(): string[] {
    return ['momentum', 'mean_reversion', 'breakout']
  }

  static getDefaultConfig(strategyName: string, riskLevel: 'low' | 'medium' | 'high'): StrategyConfig {
    const baseConfigs = {
      low: {
        maxPositionSize: 5,
        stopLossPercent: 2,
        takeProfitPercent: 4
      },
      medium: {
        maxPositionSize: 10,
        stopLossPercent: 3,
        takeProfitPercent: 6
      },
      high: {
        maxPositionSize: 20,
        stopLossPercent: 5,
        takeProfitPercent: 10
      }
    }

    const base = baseConfigs[riskLevel]

    switch (strategyName) {
      case 'momentum':
        return {
          name: 'Momentum Strategy',
          riskLevel,
          timeframe: '1h',
          ...base,
          parameters: {
            rsiPeriod: 14,
            shortMAPeriod: 10,
            longMAPeriod: 20,
            volumeThreshold: 1.2
          }
        }
      
      case 'mean_reversion':
        return {
          name: 'Mean Reversion Strategy',
          riskLevel,
          timeframe: '1h',
          ...base,
          parameters: {
            rsiPeriod: 14,
            bollingerPeriod: 20,
            oversoldThreshold: 30,
            overboughtThreshold: 70
          }
        }
      
      case 'breakout':
        return {
          name: 'Breakout Strategy',
          riskLevel,
          timeframe: '1h',
          ...base,
          parameters: {
            breakoutThreshold: 0.002,
            volumeMultiplier: 1.5,
            minRangePercent: 2
          }
        }
      
      default:
        throw new Error(`Unknown strategy: ${strategyName}`)
    }
  }
}

export { BaseTradingStrategy }