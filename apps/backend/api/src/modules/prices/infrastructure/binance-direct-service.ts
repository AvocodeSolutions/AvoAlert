/**
 * Binance Direct API Service
 * Direct API calls to Binance for price data when CoinGecko fails
 */

import { FallbackPriceService } from '../application/ports'
import { PriceData } from '../domain/entities'

export class BinanceDirectService implements FallbackPriceService {
  private readonly baseUrl = 'https://api.binance.com/api/v3'
  private readonly requestTimeout = 5000 // 5 seconds

  async getCurrentPrice(symbol: string): Promise<PriceData> {
    const prices = await this.getCurrentPrices([symbol])
    const price = prices.get(symbol)
    
    if (!price) {
      throw new Error(`Price not found for symbol: ${symbol}`)
    }
    
    return price
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Test Binance API availability with a simple ping
      const response = await fetch(`${this.baseUrl}/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      return response.ok
    } catch {
      return false
    }
  }

  async getCurrentPrices(symbols: string[]): Promise<Map<string, PriceData>> {
    const prices = new Map<string, PriceData>()

    try {
      // Binance API: Get 24hr ticker statistics
      const url = `${this.baseUrl}/ticker/24hr`
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout)
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'AvoAlert-Backend'
        }
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Binance API HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json() as Array<{
        symbol: string
        lastPrice: string
        priceChangePercent: string
        volume: string
        highPrice: string
        lowPrice: string
      }>

      // Filter and map the requested symbols
      const requestedSymbols = new Set(symbols)
      
      for (const ticker of data) {
        if (requestedSymbols.has(ticker.symbol)) {
          const priceData: PriceData = {
            symbol: ticker.symbol,
            price: parseFloat(ticker.lastPrice),
            change24h: parseFloat(ticker.priceChangePercent),
            volume24h: parseFloat(ticker.volume),
            high24h: parseFloat(ticker.highPrice),
            low24h: parseFloat(ticker.lowPrice),
            lastUpdate: new Date(),
            source: 'binance'
          }
          
          prices.set(ticker.symbol, priceData)
        }
      }

      console.log(`✅ Binance Direct API: Retrieved ${prices.size}/${symbols.length} prices`)
      return prices

    } catch (error) {
      console.error('Binance Direct API error:', error)
      throw new Error(`Failed to fetch prices from Binance: ${error.message}`)
    }
  }
}