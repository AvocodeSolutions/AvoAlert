/**
 * Redis Price Cache Repository
 * Handles caching of price data with TTL support
 */

import { PriceCacheRepository } from '../application/ports'
import { PriceData } from '../domain/entities'

// Redis client interface (compatible with @upstash/redis)
interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: any, opts?: any): Promise<any>
  mget(keys: string[]): Promise<(string | null)[]>
  mset(kv: Record<string, any>): Promise<any>
  del(key: string): Promise<number>
  exists(key: string): Promise<number>
  keys(pattern: string): Promise<string[]>
  ping(): Promise<string>
}

export class RedisPriceCacheRepository implements PriceCacheRepository {
  private readonly keyPrefix = 'price:'
  private readonly defaultTtl = 600 // 10 minutes (increased for better performance)

  constructor(private redis: RedisClient) {}

  async get(symbol: string): Promise<PriceData | null> {
    try {
      const key = this.buildKey(symbol)
      const data = await this.redis.get(key)
      
      if (!data) {
        return null
      }

      return this.deserializePriceData(data)
    } catch (error) {
      throw new Error(`Cache retrieval failed for ${symbol}`)
    }
  }

  async set(symbol: string, data: PriceData, ttlSeconds = this.defaultTtl): Promise<void> {
    try {
      const key = this.buildKey(symbol)
      const serializedData = this.serializePriceData(data)
      
      await this.redis.set(key, serializedData, { ex: ttlSeconds })
    } catch (error) {
      throw new Error(`Cache storage failed for ${symbol}`)
    }
  }

  async getMultiple(symbols: string[]): Promise<Map<string, PriceData>> {
    try {
      if (symbols.length === 0) {
        return new Map()
      }

      const keys = symbols.map(symbol => this.buildKey(symbol))
      const results = await this.redis.mget(keys)
      
      const priceMap = new Map<string, PriceData>()
      
      for (let i = 0; i < symbols.length; i++) {
        const data = results[i]
        if (data) {
          try {
            const priceData = this.deserializePriceData(data)
            priceMap.set(symbols[i], priceData)
          } catch (error) {
          }
        }
      }

      return priceMap
    } catch (error) {
      throw new Error('Cache bulk retrieval failed')
    }
  }

  async setMultiple(priceData: Map<string, PriceData>, ttlSeconds = this.defaultTtl): Promise<void> {
    try {
      if (priceData.size === 0) {
        return
      }

      // Prepare key-value object for MSET
      const keyValuePairs: Record<string, string> = {}
      
      for (const [symbol, data] of priceData.entries()) {
        const key = this.buildKey(symbol)
        const serializedData = this.serializePriceData(data)
        keyValuePairs[key] = serializedData
      }

      await this.redis.mset(keyValuePairs)

      // Set TTL for each key (Redis doesn't support MSET with TTL)
      // In production, consider using Redis pipelines for better performance
      for (const symbol of priceData.keys()) {
        const key = this.buildKey(symbol)
        const value = await this.redis.get(key)
        if (value) {
          await this.redis.set(key, value, { ex: ttlSeconds })
        }
      }
    } catch (error) {
      throw new Error('Cache bulk storage failed')
    }
  }

  async delete(symbol: string): Promise<void> {
    try {
      const key = this.buildKey(symbol)
      await this.redis.del(key)
    } catch (error) {
      throw new Error(`Cache deletion failed for ${symbol}`)
    }
  }

  async exists(symbol: string): Promise<boolean> {
    try {
      const key = this.buildKey(symbol)
      const result = await this.redis.exists(key)
      return result === 1
    } catch (error) {
      return false
    }
  }

  async getKeys(pattern = '*'): Promise<string[]> {
    try {
      const searchPattern = this.keyPrefix + pattern
      const keys = await this.redis.keys(searchPattern)
      
      // Remove prefix from keys
      return keys.map(key => key.substring(this.keyPrefix.length))
    } catch (error) {
      throw new Error('Cache keys retrieval failed')
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.redis.ping()
      return result === 'PONG'
    } catch (error) {
      return false
    }
  }

  async getCacheStats(): Promise<{
    totalKeys: number
    memoryUsage?: string
    connections?: number
  }> {
    try {
      const keys = await this.getKeys()
      return {
        totalKeys: keys.length
        // Additional stats can be added here using Redis INFO commands
      }
    } catch (error) {
      return { totalKeys: 0 }
    }
  }

  private buildKey(symbol: string): string {
    return `${this.keyPrefix}${symbol.toUpperCase()}`
  }

  private serializePriceData(data: PriceData): string {
    try {
      // Create a serializable object
      const serializable = {
        ...data,
        lastUpdate: data.lastUpdate.toISOString()
      }
      return JSON.stringify(serializable)
    } catch (error) {
      throw new Error(`Failed to serialize price data: ${error}`)
    }
  }

  private deserializePriceData(data: string): PriceData {
    try {
      const parsed = JSON.parse(data)
      
      // Reconstruct Date object
      return {
        ...parsed,
        lastUpdate: new Date(parsed.lastUpdate)
      }
    } catch (error) {
      throw new Error(`Failed to deserialize price data: ${error}`)
    }
  }

  // Cleanup expired keys (optional utility method)
  async cleanup(): Promise<number> {
    try {
      const keys = await this.redis.keys(this.keyPrefix + '*')
      let cleanedCount = 0

      for (const key of keys) {
        const exists = await this.redis.exists(key)
        if (!exists) {
          cleanedCount++
        }
      }

      return cleanedCount
    } catch (error) {
      return 0
    }
  }
}