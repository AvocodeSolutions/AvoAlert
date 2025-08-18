/**
 * Prices Module Entry Point
 * Dependency injection and module setup
 */

import { Router } from 'express'

// Domain
import { PriceData, SymbolMapping } from './domain/entities'

// Application Layer
import { GetCurrentPricesUseCase } from './application/usecases/get-current-prices'
import { StartPriceStreamUseCase } from './application/usecases/start-price-stream'
import { GetPriceHealthUseCase } from './application/usecases/get-price-health'

// Infrastructure Layer
import { BinanceStreamService } from './infrastructure/binance-stream-service'
import { RedisPriceCacheRepository } from './infrastructure/redis-price-cache'
import { CoinGeckoFallbackService } from './infrastructure/coingecko-fallback-service'
import { DefaultSymbolMappingService } from './infrastructure/symbol-mapping-service'
import { DefaultPriceHealthService } from './infrastructure/price-health-service'

// Interface Layer
import { createPricesRouter } from './interface/http/router'

// Types for external dependencies (compatible with @upstash/redis)
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

interface PriceEventPublisher {
  publish(event: { type: string; data: any }): Promise<void>
  publishPriceUpdate(priceData: PriceData): Promise<void>
  publishConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting'): Promise<void>
}

// Simple event publisher implementation
class SimplePriceEventPublisher implements PriceEventPublisher {
  async publish(event: { type: string; data: any }): Promise<void> {
    // Removed console.log for better performance
    // In production, this could publish to Redis, RabbitMQ, etc.
  }

  async publishPriceUpdate(priceData: PriceData): Promise<void> {
    await this.publish({
      type: 'price_update',
      data: priceData
    })
  }

  async publishConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting'): Promise<void> {
    await this.publish({
      type: 'connection_status',
      data: { status, timestamp: new Date() }
    })
  }
}

export interface PricesModuleConfig {
  redisClient: RedisClient
  enableStream?: boolean
  defaultSymbols?: string[]
}

export interface PricesModule {
  router: Router
  startPriceStream: (symbols: string[]) => Promise<void>
  stopPriceStream: () => Promise<void>
  getCurrentPrices: (symbols: string[]) => Promise<Map<string, PriceData>>
  healthCheck: () => Promise<any>
}

export function createPricesModule(config: PricesModuleConfig): PricesModule {
  const { redisClient, enableStream = true, defaultSymbols = [] } = config

  // Infrastructure Layer - Create services
  const symbolMappingService = new DefaultSymbolMappingService()
  const cacheRepository = new RedisPriceCacheRepository(redisClient)
  const fallbackService = new CoinGeckoFallbackService(symbolMappingService)
  const streamService = new BinanceStreamService()
  const healthService = new DefaultPriceHealthService()
  const eventPublisher = new SimplePriceEventPublisher()

  // Application Layer - Create use cases with dependency injection
  const getCurrentPricesUseCase = new GetCurrentPricesUseCase(
    cacheRepository,
    fallbackService,
    symbolMappingService
  )

  const startPriceStreamUseCase = new StartPriceStreamUseCase(
    streamService,
    cacheRepository,
    symbolMappingService,
    eventPublisher
  )

  const getPriceHealthUseCase = new GetPriceHealthUseCase(
    streamService,
    cacheRepository,
    fallbackService,
    healthService
  )

  // Interface Layer - Create HTTP router
  const router = createPricesRouter(
    getCurrentPricesUseCase,
    startPriceStreamUseCase,
    getPriceHealthUseCase
  )

  // Auto-start price stream if enabled and symbols provided
  if (enableStream && defaultSymbols.length > 0) {
    setTimeout(async () => {
      try {
        await startPriceStreamUseCase.execute({
          symbols: defaultSymbols,
          enableCaching: true,
          cacheTtl: 300
        })
      } catch (error) {
      }
    }, 5000) // Wait 5 seconds after startup
  }

  return {
    router,
    
    async startPriceStream(symbols: string[]): Promise<void> {
      const result = await startPriceStreamUseCase.execute({
        symbols,
        enableCaching: true,
        cacheTtl: 300
      })
      
      if (!result.success) {
        throw new Error(`Failed to start price stream: ${result.errors.join(', ')}`)
      }
    },

    async stopPriceStream(): Promise<void> {
      await startPriceStreamUseCase.stop()
    },

    async getCurrentPrices(symbols: string[]): Promise<Map<string, PriceData>> {
      const result = await getCurrentPricesUseCase.execute({
        symbols,
        preferCache: true,
        maxCacheAge: 300
      })
      
      return result.prices
    },

    async healthCheck(): Promise<any> {
      return await getPriceHealthUseCase.execute()
    }
  }
}

// Export types for external use
export type { PriceData, SymbolMapping }
export { PriceError, PriceUpdateEvent } from './domain/entities'

// Export for testing purposes
export {
  GetCurrentPricesUseCase,
  StartPriceStreamUseCase,
  GetPriceHealthUseCase,
  BinanceStreamService,
  RedisPriceCacheRepository,
  CoinGeckoFallbackService,
  DefaultSymbolMappingService,
  DefaultPriceHealthService
}