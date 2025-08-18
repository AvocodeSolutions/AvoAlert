/**
 * Domain entities for the Prices module
 * Core business logic and data structures
 */

export interface PriceData {
  symbol: string           // e.g., "BTCUSDT"
  price: number           // Current price in USD
  change24h: number       // 24h price change percentage
  volume24h: number       // 24h trading volume
  high24h: number         // 24h high price
  low24h: number          // 24h low price
  lastUpdate: Date        // Last update timestamp
  source: 'binance' | 'coingecko' | 'cache'  // Data source
}

export interface SymbolMapping {
  symbol: string          // Internal symbol (BTCUSDT)
  binanceSymbol: string   // Binance API symbol (BTCUSDT)
  coinGeckoId?: string    // CoinGecko coin ID (bitcoin)
  tradingViewSymbol: string // TradingView symbol (BINANCE:BTCUSDT)
}

export interface PriceSubscription {
  symbols: string[]       // List of symbols to track
  isActive: boolean      // Subscription status
  lastHeartbeat: Date    // Last WebSocket heartbeat
  reconnectCount: number // Reconnection attempts
}

export interface PriceCache {
  key: string            // Cache key (symbol)
  data: PriceData       // Cached price data
  ttl: number           // Time to live in seconds
  createdAt: Date       // Cache creation time
}

export class PriceUpdateEvent {
  constructor(
    public readonly symbol: string,
    public readonly priceData: PriceData,
    public readonly timestamp: Date = new Date()
  ) {}
}

export class PriceError extends Error {
  constructor(
    message: string,
    public readonly symbol?: string,
    public readonly source?: string,
    public readonly originalError?: Error
  ) {
    super(message)
    this.name = 'PriceError'
  }
}