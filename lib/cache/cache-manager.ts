import Redis from 'ioredis'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface CacheConfig {
  defaultTTL: number // seconds
  maxMemoryPolicy: 'allkeys-lru' | 'volatile-lru' | 'allkeys-lfu' | 'volatile-lfu'
  keyPrefix: string
  enableCompression: boolean
  enableMetrics: boolean
}

export interface CacheMetrics {
  hits: number
  misses: number
  sets: number
  deletes: number
  errors: number
  totalKeys: number
  memoryUsage: number
  hitRate: number
}

export interface CacheItem<T = any> {
  value: T
  timestamp: number
  ttl: number
  size: number
  tags: string[]
}

export interface CacheStrategy {
  name: string
  ttl: number
  warmup?: () => Promise<void>
  invalidationPattern?: string
  compression?: boolean
}

class CacheManager {
  private redis: Redis | null = null
  private localCache = new Map<string, CacheItem>()
  private config: CacheConfig
  private metrics: CacheMetrics
  private strategies = new Map<string, CacheStrategy>()
  private isConnected = false

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 3600, // 1 hour
      maxMemoryPolicy: 'allkeys-lru',
      keyPrefix: 'agent_empire:',
      enableCompression: true,
      enableMetrics: true,
      ...config
    }

    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      totalKeys: 0,
      memoryUsage: 0,
      hitRate: 0
    }

    this.initializeRedis()
    this.setupCacheStrategies()
    this.startMetricsCollection()
  }

  private async initializeRedis() {
    try {
      if (process.env.REDIS_URL) {
                 this.redis = new Redis(process.env.REDIS_URL, {
           maxRetriesPerRequest: 3,
           connectTimeout: 10000,
           lazyConnect: true,
           keyPrefix: this.config.keyPrefix
         })

        this.redis.on('connect', () => {
          console.log('✅ Redis cache connected')
          this.isConnected = true
          this.warmupCache()
        })

        this.redis.on('error', (error) => {
          console.error('❌ Redis cache error:', error)
          this.isConnected = false
          this.recordMetric('errors')
        })

        this.redis.on('close', () => {
          console.log('⚠️ Redis cache disconnected')
          this.isConnected = false
        })

        await this.redis.connect()
      } else {
        console.log('⚠️ No Redis URL configured, using local memory cache only')
      }
    } catch (error) {
      console.error('❌ Failed to initialize Redis:', error)
      this.isConnected = false
    }
  }

  private setupCacheStrategies() {
    // Market data caching strategy
    this.addStrategy({
      name: 'market_data',
      ttl: 30, // 30 seconds for real-time data
      warmup: this.warmupMarketData.bind(this),
      invalidationPattern: 'market:*',
      compression: false // Fast access needed
    })

    // Agent performance caching
    this.addStrategy({
      name: 'agent_performance',
      ttl: 300, // 5 minutes
      warmup: this.warmupAgentPerformance.bind(this),
      invalidationPattern: 'agent:*:performance',
      compression: true
    })

    // User data caching
    this.addStrategy({
      name: 'user_data',
      ttl: 900, // 15 minutes
      invalidationPattern: 'user:*',
      compression: true
    })

    // System metrics caching
    this.addStrategy({
      name: 'system_metrics',
      ttl: 60, // 1 minute
      warmup: this.warmupSystemMetrics.bind(this),
      invalidationPattern: 'system:*',
      compression: false
    })

    // Trading signals caching
    this.addStrategy({
      name: 'trading_signals',
      ttl: 120, // 2 minutes
      invalidationPattern: 'signal:*',
      compression: true
    })
  }

  addStrategy(strategy: CacheStrategy) {
    this.strategies.set(strategy.name, strategy)
    console.log(`📋 Cache strategy registered: ${strategy.name}`)
  }

  async get<T>(key: string, strategy?: string): Promise<T | null> {
    const cacheKey = this.buildKey(key)
    
    try {
      let result: T | null = null

      // Try Redis first if available
      if (this.redis && this.isConnected) {
        const cached = await this.redis.get(cacheKey)
        if (cached) {
          result = this.deserialize<T>(cached)
          this.recordMetric('hits')
          return result
        }
      }

      // Fallback to local cache
      const localItem = this.localCache.get(cacheKey)
      if (localItem && this.isValidCacheItem(localItem)) {
        result = localItem.value as T
        this.recordMetric('hits')
        return result
      }

      this.recordMetric('misses')
      return null
    } catch (error) {
      console.error(`Cache get error for key ${cacheKey}:`, error)
      this.recordMetric('errors')
      return null
    }
  }

  async set<T>(
    key: string, 
    value: T, 
    ttl?: number, 
    strategy?: string,
    tags: string[] = []
  ): Promise<boolean> {
    const cacheKey = this.buildKey(key)
    const strategyConfig = strategy ? this.strategies.get(strategy) : null
    const finalTTL = ttl || strategyConfig?.ttl || this.config.defaultTTL
    
    try {
      const serialized = this.serialize(value, strategyConfig?.compression)
      const cacheItem: CacheItem<T> = {
        value,
        timestamp: Date.now(),
        ttl: finalTTL,
        size: this.calculateSize(serialized),
        tags
      }

      // Set in Redis if available
      if (this.redis && this.isConnected) {
        await this.redis.setex(cacheKey, finalTTL, serialized)
        
        // Add tags for invalidation
        if (tags.length > 0) {
          await this.addTagMappings(tags, cacheKey)
        }
      }

      // Set in local cache
      this.localCache.set(cacheKey, cacheItem)
      this.cleanupLocalCache()

      this.recordMetric('sets')
      return true
    } catch (error) {
      console.error(`Cache set error for key ${cacheKey}:`, error)
      this.recordMetric('errors')
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    const cacheKey = this.buildKey(key)
    
    try {
      // Delete from Redis
      if (this.redis && this.isConnected) {
        await this.redis.del(cacheKey)
      }

      // Delete from local cache
      const deleted = this.localCache.delete(cacheKey)
      
      if (deleted) {
        this.recordMetric('deletes')
      }
      
      return true
    } catch (error) {
      console.error(`Cache delete error for key ${cacheKey}:`, error)
      this.recordMetric('errors')
      return false
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    let deletedCount = 0
    
    try {
      // Invalidate in Redis
      if (this.redis && this.isConnected) {
        const keys = await this.redis.keys(`${this.config.keyPrefix}${pattern}`)
        if (keys.length > 0) {
          await this.redis.del(...keys)
          deletedCount += keys.length
        }
      }

             // Invalidate in local cache
       const regex = new RegExp(pattern.replace('*', '.*'))
       for (const [key] of Array.from(this.localCache.entries())) {
         if (regex.test(key)) {
           this.localCache.delete(key)
           deletedCount++
         }
       }

      console.log(`🗑️ Invalidated ${deletedCount} cache entries matching pattern: ${pattern}`)
      return deletedCount
    } catch (error) {
      console.error(`Cache invalidation error for pattern ${pattern}:`, error)
      this.recordMetric('errors')
      return 0
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    let deletedCount = 0
    
    try {
      for (const tag of tags) {
        const keys = await this.getKeysByTag(tag)
        for (const key of keys) {
          await this.delete(key)
          deletedCount++
        }
      }

      console.log(`🏷️ Invalidated ${deletedCount} cache entries by tags: ${tags.join(', ')}`)
      return deletedCount
    } catch (error) {
      console.error(`Tag-based invalidation error:`, error)
      return 0
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    strategy?: string,
    tags: string[] = []
  ): Promise<T> {
    const cached = await this.get<T>(key, strategy)
    if (cached !== null) {
      return cached
    }

    try {
      const value = await fetcher()
      await this.set(key, value, ttl, strategy, tags)
      return value
    } catch (error) {
      console.error(`Cache getOrSet error for key ${key}:`, error)
      throw error
    }
  }

  async warmupCache(): Promise<void> {
    console.log('🔥 Starting cache warmup...')
    
    const warmupPromises = Array.from(this.strategies.values())
      .filter(strategy => strategy.warmup)
      .map(strategy => {
        return strategy.warmup!().catch(error => {
          console.error(`Warmup failed for strategy ${strategy.name}:`, error)
        })
      })

    await Promise.allSettled(warmupPromises)
    console.log('✅ Cache warmup completed')
  }

  private async warmupMarketData(): Promise<void> {
    try {
      // Warmup popular trading pairs
      const popularPairs = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'SOLUSDT']
      
      for (const pair of popularPairs) {
        // In a real implementation, fetch actual market data
        const mockData = {
          symbol: pair,
          price: Math.random() * 50000,
          change24h: (Math.random() - 0.5) * 10,
          volume24h: Math.random() * 1000000
        }
        
        await this.set(`market:${pair}`, mockData, 30, 'market_data')
      }
      
      console.log('📈 Market data cache warmed up')
    } catch (error) {
      console.error('Market data warmup failed:', error)
    }
  }

  private async warmupAgentPerformance(): Promise<void> {
    try {
      // Warmup agent performance data
      const agents = await prisma.agent.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' }
      })

      for (const agent of agents) {
        const performance = {
          totalTrades: Math.floor(Math.random() * 100),
          successRate: Math.random() * 100,
          totalProfit: (Math.random() - 0.5) * 1000,
          lastUpdate: new Date()
        }
        
        await this.set(
          `agent:${agent.id}:performance`, 
          performance, 
          300, 
          'agent_performance',
          [`agent:${agent.id}`, `user:${agent.userId}`]
        )
      }
      
      console.log('🤖 Agent performance cache warmed up')
    } catch (error) {
      console.error('Agent performance warmup failed:', error)
    }
  }

  private async warmupSystemMetrics(): Promise<void> {
    try {
      const systemMetrics = {
        activeAgents: Math.floor(Math.random() * 100),
        totalTrades: Math.floor(Math.random() * 10000),
        systemLoad: Math.random(),
        lastUpdate: new Date()
      }
      
      await this.set('system:metrics', systemMetrics, 60, 'system_metrics')
      console.log('📊 System metrics cache warmed up')
    } catch (error) {
      console.error('System metrics warmup failed:', error)
    }
  }

  private buildKey(key: string): string {
    return `${this.config.keyPrefix}${key}`
  }

  private serialize<T>(value: T, compress = false): string {
    try {
      let serialized = JSON.stringify(value)
      
      if (compress && this.config.enableCompression) {
        // In a real implementation, use compression library like lz4 or gzip
        // For now, just return the JSON string
        serialized = `compressed:${serialized}`
      }
      
      return serialized
    } catch (error) {
      console.error('Serialization error:', error)
      return JSON.stringify(null)
    }
  }

  private deserialize<T>(value: string): T | null {
    try {
      if (value.startsWith('compressed:')) {
        // In a real implementation, decompress here
        value = value.replace('compressed:', '')
      }
      
      return JSON.parse(value)
    } catch (error) {
      console.error('Deserialization error:', error)
      return null
    }
  }

  private isValidCacheItem(item: CacheItem): boolean {
    const now = Date.now()
    const expiry = item.timestamp + (item.ttl * 1000)
    return now < expiry
  }

  private calculateSize(value: string): number {
    return new Blob([value]).size
  }

  private cleanupLocalCache() {
         // Remove expired items
     for (const [key, item] of Array.from(this.localCache.entries())) {
       if (!this.isValidCacheItem(item)) {
         this.localCache.delete(key)
       }
     }

    // If cache is too large, remove oldest items
    const maxSize = 1000 // Maximum 1000 items in local cache
    if (this.localCache.size > maxSize) {
      const entries = Array.from(this.localCache.entries())
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp)
      
      const toRemove = entries.slice(0, this.localCache.size - maxSize)
      for (const [key] of toRemove) {
        this.localCache.delete(key)
      }
    }
  }

  private async addTagMappings(tags: string[], key: string): Promise<void> {
    if (!this.redis || !this.isConnected) return

    try {
      for (const tag of tags) {
        await this.redis.sadd(`tag:${tag}`, key)
        await this.redis.expire(`tag:${tag}`, 86400) // 24 hours
      }
    } catch (error) {
      console.error('Error adding tag mappings:', error)
    }
  }

  private async getKeysByTag(tag: string): Promise<string[]> {
    if (!this.redis || !this.isConnected) return []

    try {
      return await this.redis.smembers(`tag:${tag}`)
    } catch (error) {
      console.error('Error getting keys by tag:', error)
      return []
    }
  }

  private recordMetric(type: keyof CacheMetrics) {
    if (!this.config.enableMetrics) return

    this.metrics[type]++
    
    // Calculate hit rate
    const total = this.metrics.hits + this.metrics.misses
    this.metrics.hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0
  }

  private startMetricsCollection() {
    if (!this.config.enableMetrics) return

    setInterval(async () => {
      try {
        // Update total keys count
        if (this.redis && this.isConnected) {
          const info = await this.redis.info('keyspace')
          const match = info.match(/keys=(\d+)/)
          this.metrics.totalKeys = match ? parseInt(match[1]) : 0
          
                     // Get memory usage (simplified for this implementation)
           this.metrics.memoryUsage = this.metrics.totalKeys * 1024 // Estimate
        } else {
          this.metrics.totalKeys = this.localCache.size
          this.metrics.memoryUsage = Array.from(this.localCache.values())
            .reduce((sum, item) => sum + item.size, 0)
        }

        // Log metrics periodically
        if (this.metrics.hits + this.metrics.misses > 0) {
          console.log(`📊 Cache Metrics: ${this.metrics.hits + this.metrics.misses} requests, ${this.metrics.hitRate.toFixed(1)}% hit rate, ${this.metrics.totalKeys} keys`)
        }
      } catch (error) {
        console.error('Error collecting cache metrics:', error)
      }
    }, 60000) // Every minute
  }

  // Public API methods
  getMetrics(): CacheMetrics {
    return { ...this.metrics }
  }

  getStrategies(): Map<string, CacheStrategy> {
    return new Map(this.strategies)
  }

  async flushAll(): Promise<boolean> {
    try {
      if (this.redis && this.isConnected) {
        await this.redis.flushdb()
      }
      
      this.localCache.clear()
      
      // Reset metrics
      this.metrics = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        errors: 0,
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0
      }
      
      console.log('🗑️ Cache flushed completely')
      return true
    } catch (error) {
      console.error('Error flushing cache:', error)
      return false
    }
  }

  async healthCheck(): Promise<{
    redis: boolean
    local: boolean
    metrics: CacheMetrics
    strategies: string[]
  }> {
    let redisHealth = false
    
    try {
      if (this.redis && this.isConnected) {
        await this.redis.ping()
        redisHealth = true
      }
    } catch (error) {
      redisHealth = false
    }

    return {
      redis: redisHealth,
      local: true,
      metrics: this.getMetrics(),
      strategies: Array.from(this.strategies.keys())
    }
  }

  // Utility methods for specific cache patterns
  async cacheUserData(userId: string, data: any, ttl = 900): Promise<boolean> {
    return this.set(`user:${userId}`, data, ttl, 'user_data', [`user:${userId}`])
  }

  async getCachedUserData(userId: string): Promise<any> {
    return this.get(`user:${userId}`, 'user_data')
  }

  async cacheAgentPerformance(agentId: string, performance: any): Promise<boolean> {
    return this.set(`agent:${agentId}:performance`, performance, 300, 'agent_performance', [`agent:${agentId}`])
  }

  async getCachedAgentPerformance(agentId: string): Promise<any> {
    return this.get(`agent:${agentId}:performance`, 'agent_performance')
  }

  async cacheMarketData(symbol: string, data: any): Promise<boolean> {
    return this.set(`market:${symbol}`, data, 30, 'market_data', [`market:${symbol}`])
  }

  async getCachedMarketData(symbol: string): Promise<any> {
    return this.get(`market:${symbol}`, 'market_data')
  }

  async cacheTradingSignal(agentId: string, symbol: string, signal: any): Promise<boolean> {
    return this.set(`signal:${agentId}:${symbol}`, signal, 120, 'trading_signals', [`agent:${agentId}`, `market:${symbol}`])
  }

  async getCachedTradingSignal(agentId: string, symbol: string): Promise<any> {
    return this.get(`signal:${agentId}:${symbol}`, 'trading_signals')
  }

  // Batch operations
  async mget<T>(keys: string[]): Promise<Map<string, T | null>> {
    const results = new Map<string, T | null>()
    
    await Promise.allSettled(
      keys.map(async (key) => {
        const value = await this.get<T>(key)
        results.set(key, value)
      })
    )
    
    return results
  }

  async mset<T>(entries: Array<{ key: string; value: T; ttl?: number; strategy?: string }>): Promise<boolean[]> {
    return Promise.all(
      entries.map(({ key, value, ttl, strategy }) => 
        this.set(key, value, ttl, strategy)
      )
    )
  }

  async cleanup(): Promise<void> {
    try {
      if (this.redis) {
        await this.redis.disconnect()
      }
      this.localCache.clear()
      console.log('🧹 Cache manager cleaned up')
    } catch (error) {
      console.error('Error during cache cleanup:', error)
    }
  }
}

// Singleton instance
const cacheManager = new CacheManager()

export default cacheManager
export { CacheManager }