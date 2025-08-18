/**
 * Use case: Get current prices for symbols
 * Implements caching strategy and fallback logic
 */

import { PriceData } from '../../domain/entities'
import { 
  PriceCacheRepository, 
  FallbackPriceService, 
  SymbolMappingService 
} from '../ports'

export interface GetCurrentPricesRequest {
  symbols: string[]
  preferCache?: boolean
  maxCacheAge?: number // seconds
}

export interface GetCurrentPricesResponse {
  prices: Map<string, PriceData>
  fromCache: string[]
  fromApi: string[]
  errors: string[]
}

export class GetCurrentPricesUseCase {
  constructor(
    private cacheRepository: PriceCacheRepository,
    private fallbackService: FallbackPriceService,
    private symbolMapping: SymbolMappingService
  ) {}

  async execute(request: GetCurrentPricesRequest): Promise<GetCurrentPricesResponse> {
    const { symbols, preferCache = true, maxCacheAge = 300 } = request
    const prices = new Map<string, PriceData>()
    const fromCache: string[] = []
    const fromApi: string[] = []
    const errors: string[] = []

    // Validate symbols first
    const validSymbols = symbols.filter(symbol => {
      const isValid = this.symbolMapping.validateSymbol(symbol)
      if (!isValid) {
        errors.push(`Invalid symbol: ${symbol}`)
      }
      return isValid
    })

    if (validSymbols.length === 0) {
      return { prices, fromCache, fromApi, errors }
    }

    // Try to get from cache first
    let symbolsToFetch = validSymbols
    
    if (preferCache) {
      try {
        const cachedPrices = await this.cacheRepository.getMultiple(validSymbols)
        const now = new Date()

        for (const [symbol, priceData] of cachedPrices.entries()) {
          const ageSeconds = (now.getTime() - priceData.lastUpdate.getTime()) / 1000
          
          if (ageSeconds <= maxCacheAge) {
            prices.set(symbol, priceData)
            fromCache.push(symbol)
            // Remove from symbols to fetch
            symbolsToFetch = symbolsToFetch.filter(s => s !== symbol)
          }
        }
      } catch (error) {
        console.error('Cache retrieval error:', error)
        // Continue with API fetch
      }
    }

    // Fetch remaining symbols from API
    if (symbolsToFetch.length > 0) {
      try {
        const apiPrices = await this.fallbackService.getCurrentPrices(symbolsToFetch)
        
        for (const [symbol, priceData] of apiPrices.entries()) {
          prices.set(symbol, priceData)
          fromApi.push(symbol)

          // Cache the fetched data
          try {
            await this.cacheRepository.set(symbol, priceData, 300) // 5 min TTL
          } catch (cacheError) {
            console.error(`Failed to cache price for ${symbol}:`, cacheError)
          }
        }

        // Check for symbols that couldn't be fetched
        for (const symbol of symbolsToFetch) {
          if (!apiPrices.has(symbol)) {
            errors.push(`Failed to fetch price for: ${symbol}`)
          }
        }
      } catch (error) {
        console.error('API fetch error:', error)
        symbolsToFetch.forEach(symbol => {
          errors.push(`API error for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        })
      }
    }

    return { prices, fromCache, fromApi, errors }
  }
}