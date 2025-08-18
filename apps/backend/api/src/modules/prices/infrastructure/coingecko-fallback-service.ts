/**
 * CoinGecko Fallback Service
 * Provides price data when WebSocket is unavailable
 */

import { FallbackPriceService, SymbolMappingService } from '../application/ports'
import { PriceData } from '../domain/entities'

interface CoinGeckoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  total_volume: number
  high_24h: number
  low_24h: number
  last_updated: string
}

interface CoinGeckoSimplePrice {
  [coinId: string]: {
    usd: number
    usd_24h_change: number
    usd_24h_vol: number
  }
}

export class CoinGeckoFallbackService implements FallbackPriceService {
  private readonly baseUrl = 'https://api.coingecko.com/api/v3'
  private readonly requestTimeout = 10000 // 10 seconds
  private readonly rateLimitDelay = 1000 // 1 second between requests (free tier)
  private lastRequestTime = 0

  constructor(private symbolMapping: SymbolMappingService) {}

  async getCurrentPrice(symbol: string): Promise<PriceData> {
    const prices = await this.getCurrentPrices([symbol])
    const price = prices.get(symbol)
    
    if (!price) {
      throw new Error(`Price not found for symbol: ${symbol}`)
    }
    
    return price
  }

  async getCurrentPrices(symbols: string[]): Promise<Map<string, PriceData>> {
    try {
      // Rate limiting
      await this.enforceRateLimit()

      // Convert symbols to CoinGecko IDs
      const coinIds = this.getCoinGeckoIds(symbols)
      
      if (coinIds.length === 0) {
        return new Map()
      }

      // Use simple price endpoint for better rate limits
      const prices = await this.fetchSimplePrices(coinIds)
      
      // Convert back to our symbol format
      return this.convertToInternalFormat(prices, symbols)
      
    } catch (error) {
      console.error('CoinGecko API error:', error)
      throw new Error(`Failed to fetch prices from CoinGecko: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Rate limiting
      await this.enforceRateLimit()
      
      // Test with a simple ping endpoint
      const response = await this.makeRequest('/ping', { timeout: 5000 })
      return response.gecko_says === '(V3) To the Moon!'
    } catch (error) {
      console.error('CoinGecko availability check failed:', error)
      return false
    }
  }

  private async fetchSimplePrices(coinIds: string[]): Promise<CoinGeckoSimplePrice> {
    const ids = coinIds.join(',')
    const endpoint = `/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
    
    return this.makeRequest(endpoint)
  }

  private async fetchDetailedPrices(coinIds: string[]): Promise<CoinGeckoPrice[]> {
    // Alternative endpoint with more data but higher rate limit impact
    const ids = coinIds.join(',')
    const endpoint = `/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h`
    
    return this.makeRequest(endpoint)
  }

  private async makeRequest(endpoint: string, options: { timeout?: number } = {}): Promise<any> {
    const { timeout = this.requestTimeout } = options
    const url = `${this.baseUrl}${endpoint}`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AvoAlert/1.0'
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      
      throw error
    }
  }

  private getCoinGeckoIds(symbols: string[]): string[] {
    const coinIds: string[] = []
    
    for (const symbol of symbols) {
      const coinGeckoId = this.symbolMapping.getCoinGeckoId(symbol)
      if (coinGeckoId) {
        coinIds.push(coinGeckoId)
      }
    }
    
    return coinIds
  }

  private convertToInternalFormat(
    coinGeckoPrices: CoinGeckoSimplePrice,
    originalSymbols: string[]
  ): Map<string, PriceData> {
    const priceMap = new Map<string, PriceData>()
    
    for (const symbol of originalSymbols) {
      const coinGeckoId = this.symbolMapping.getCoinGeckoId(symbol)
      
      if (coinGeckoId && coinGeckoPrices[coinGeckoId]) {
        const cgPrice = coinGeckoPrices[coinGeckoId]
        
        const priceData: PriceData = {
          symbol,
          price: cgPrice.usd,
          change24h: cgPrice.usd_24h_change || 0,
          volume24h: cgPrice.usd_24h_vol || 0,
          high24h: cgPrice.usd * 1.01, // Estimate (CoinGecko simple API doesn't provide high/low)
          low24h: cgPrice.usd * 0.99,   // Estimate
          lastUpdate: new Date(),
          source: 'coingecko'
        }
        
        priceMap.set(symbol, priceData)
      }
    }
    
    return priceMap
  }

  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const delay = this.rateLimitDelay - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, delay))
    }
    
    this.lastRequestTime = Date.now()
  }

  // Utility methods for health monitoring
  async getApiStatus(): Promise<{
    available: boolean
    responseTime: number
    rateLimit: {
      remaining?: number
      resetTime?: Date
    }
  }> {
    const start = Date.now()
    
    try {
      const isAvailable = await this.isAvailable()
      const responseTime = Date.now() - start
      
      return {
        available: isAvailable,
        responseTime,
        rateLimit: {
          // CoinGecko doesn't provide rate limit headers in free tier
          // but we can track our own usage
        }
      }
    } catch (error) {
      return {
        available: false,
        responseTime: Date.now() - start,
        rateLimit: {}
      }
    }
  }

  // Get supported coins list (useful for initialization)
  async getSupportedCoins(): Promise<{ id: string; symbol: string; name: string }[]> {
    try {
      await this.enforceRateLimit()
      
      const endpoint = '/coins/list'
      const coins = await this.makeRequest(endpoint)
      
      // Filter to only include coins we might support
      return coins.filter((coin: any) => 
        coin.symbol && 
        coin.symbol.toUpperCase().endsWith('USDT') === false && // We'll add USDT ourselves
        coin.symbol.length <= 10 // Reasonable symbol length
      )
    } catch (error) {
      console.error('Failed to get supported coins:', error)
      return []
    }
  }
}