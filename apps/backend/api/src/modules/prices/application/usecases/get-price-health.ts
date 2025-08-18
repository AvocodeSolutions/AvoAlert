/**
 * Use case: Get price service health status
 * Monitors WebSocket connection, cache, and API availability
 */

import { 
  PriceStreamService, 
  PriceCacheRepository, 
  FallbackPriceService,
  PriceHealthService 
} from '../ports'

export interface PriceHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  services: {
    websocket: {
      connected: boolean
      lastUpdate: Date | null
      subscribedSymbols: string[]
    }
    cache: {
      available: boolean
      responseTime?: number
    }
    fallback: {
      available: boolean
      responseTime?: number
    }
  }
  metrics: {
    errorCount: number
    uptime: number
    reconnectCount: number
  }
}

export class GetPriceHealthUseCase {
  constructor(
    private streamService: PriceStreamService,
    private cacheRepository: PriceCacheRepository,
    private fallbackService: FallbackPriceService,
    private healthService: PriceHealthService
  ) {}

  async execute(): Promise<PriceHealthResponse> {
    const timestamp = new Date()
    
    // Check WebSocket health
    const websocketHealth = await this.checkWebSocketHealth()
    
    // Check cache health
    const cacheHealth = await this.checkCacheHealth()
    
    // Check fallback API health
    const fallbackHealth = await this.checkFallbackHealth()
    
    // Get overall metrics
    const metrics = await this.getMetrics()
    
    // Determine overall status
    const status = this.determineOverallStatus(
      websocketHealth.connected,
      cacheHealth.available,
      fallbackHealth.available,
      metrics.errorCount
    )

    return {
      status,
      timestamp,
      services: {
        websocket: websocketHealth,
        cache: cacheHealth,
        fallback: fallbackHealth
      },
      metrics
    }
  }

  private async checkWebSocketHealth() {
    try {
      const subscription = this.streamService.getSubscription()
      const isConnected = this.streamService.isConnected()
      
      return {
        connected: isConnected,
        lastUpdate: subscription.lastHeartbeat,
        subscribedSymbols: subscription.symbols
      }
    } catch (error) {
      return {
        connected: false,
        lastUpdate: null,
        subscribedSymbols: []
      }
    }
  }

  private async checkCacheHealth() {
    const start = Date.now()
    
    try {
      // Test cache with a simple operation
      const testKey = 'health_check_' + Date.now()
      await this.cacheRepository.set(testKey, {
        symbol: 'TEST',
        price: 1,
        change24h: 0,
        volume24h: 0,
        high24h: 1,
        low24h: 1,
        lastUpdate: new Date(),
        source: 'cache'
      }, 1) // 1 second TTL
      
      await this.cacheRepository.delete(testKey)
      
      const responseTime = Date.now() - start
      
      return {
        available: true,
        responseTime
      }
    } catch (error) {
      return {
        available: false,
        responseTime: Date.now() - start
      }
    }
  }

  private async checkFallbackHealth() {
    const start = Date.now()
    
    try {
      const isAvailable = await this.fallbackService.isAvailable()
      const responseTime = Date.now() - start
      
      return {
        available: isAvailable,
        responseTime
      }
    } catch (error) {
      return {
        available: false,
        responseTime: Date.now() - start
      }
    }
  }

  private async getMetrics() {
    try {
      const healthStatus = await this.healthService.getStatus()
      const subscription = this.streamService.getSubscription()
      
      return {
        errorCount: healthStatus.errorCount,
        uptime: Date.now() - (healthStatus.lastUpdate?.getTime() || Date.now()),
        reconnectCount: subscription.reconnectCount
      }
    } catch (error) {
      return {
        errorCount: 0,
        uptime: 0,
        reconnectCount: 0
      }
    }
  }

  private determineOverallStatus(
    websocketConnected: boolean,
    cacheAvailable: boolean,
    fallbackAvailable: boolean,
    errorCount: number
  ): 'healthy' | 'degraded' | 'unhealthy' {
    // Unhealthy: Neither websocket nor fallback working
    if (!websocketConnected && !fallbackAvailable) {
      return 'unhealthy'
    }
    
    // Degraded: Either websocket down or cache down, or high error count
    if (!websocketConnected || !cacheAvailable || errorCount > 10) {
      return 'degraded'
    }
    
    // Healthy: All services working
    return 'healthy'
  }
}