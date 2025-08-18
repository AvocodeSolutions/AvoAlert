/**
 * Application ports (interfaces) for the Prices module
 * Defines contracts for infrastructure and external services
 */

import { PriceData, SymbolMapping, PriceSubscription } from '../domain/entities'

// Repository interface for price data persistence
export interface PriceCacheRepository {
  get(symbol: string): Promise<PriceData | null>
  set(symbol: string, data: PriceData, ttlSeconds?: number): Promise<void>
  getMultiple(symbols: string[]): Promise<Map<string, PriceData>>
  setMultiple(priceData: Map<string, PriceData>, ttlSeconds?: number): Promise<void>
  delete(symbol: string): Promise<void>
  exists(symbol: string): Promise<boolean>
  getKeys(pattern?: string): Promise<string[]>
}

// WebSocket service interface for real-time price streams
export interface PriceStreamService {
  connect(): Promise<void>
  disconnect(): Promise<void>
  subscribe(symbols: string[]): Promise<void>
  unsubscribe(symbols: string[]): Promise<void>
  isConnected(): boolean
  getSubscription(): PriceSubscription
  onPriceUpdate(callback: (data: PriceData) => void): void
  onError(callback: (error: Error) => void): void
  onReconnect(callback: () => void): void
}

// Fallback price service interface (REST API)
export interface FallbackPriceService {
  getCurrentPrice(symbol: string): Promise<PriceData>
  getCurrentPrices(symbols: string[]): Promise<Map<string, PriceData>>
  isAvailable(): Promise<boolean>
}

// Symbol mapping service for different exchange formats
export interface SymbolMappingService {
  getMapping(symbol: string): SymbolMapping | null
  getAllMappings(): SymbolMapping[]
  getBinanceSymbol(symbol: string): string | null
  getCoinGeckoId(symbol: string): string | null
  getTradingViewSymbol(symbol: string): string | null
  validateSymbol(symbol: string): boolean
}

// Event publishing interface for price updates
export interface PriceEventPublisher {
  publish(event: { type: string; data: any }): Promise<void>
  publishPriceUpdate(priceData: PriceData): Promise<void>
  publishConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting'): Promise<void>
}

// Health monitoring interface
export interface PriceHealthService {
  getStatus(): Promise<{
    streamConnected: boolean
    lastUpdate: Date | null
    cacheHealth: boolean
    fallbackAvailable: boolean
    subscribedSymbols: string[]
    errorCount: number
  }>
  resetErrors(): Promise<void>
}