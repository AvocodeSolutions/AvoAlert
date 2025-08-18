/**
 * Use case: Start price streaming service
 * Manages WebSocket connections and symbol subscriptions
 */

import { PriceData } from '../../domain/entities'
import { 
  PriceStreamService, 
  PriceCacheRepository, 
  SymbolMappingService,
  PriceEventPublisher 
} from '../ports'

export interface StartPriceStreamRequest {
  symbols: string[]
  enableCaching?: boolean
  cacheTtl?: number
}

export interface StartPriceStreamResponse {
  success: boolean
  connectedSymbols: string[]
  errors: string[]
  streamStatus: 'connected' | 'connecting' | 'failed'
}

export class StartPriceStreamUseCase {
  private isRunning = false

  constructor(
    private streamService: PriceStreamService,
    private cacheRepository: PriceCacheRepository,
    private symbolMapping: SymbolMappingService,
    private eventPublisher: PriceEventPublisher
  ) {}

  async execute(request: StartPriceStreamRequest): Promise<StartPriceStreamResponse> {
    const { symbols, enableCaching = true, cacheTtl = 300 } = request
    const connectedSymbols: string[] = []
    const errors: string[] = []

    try {
      // Validate symbols
      const validSymbols = symbols.filter(symbol => {
        const isValid = this.symbolMapping.validateSymbol(symbol)
        if (!isValid) {
          errors.push(`Invalid symbol: ${symbol}`)
        }
        return isValid
      })

      if (validSymbols.length === 0) {
        return {
          success: false,
          connectedSymbols,
          errors: [...errors, 'No valid symbols provided'],
          streamStatus: 'failed'
        }
      }

      // Set up event handlers
      this.setupEventHandlers(enableCaching, cacheTtl)

      // Connect to stream service
      if (!this.streamService.isConnected()) {
        await this.streamService.connect()
        await this.eventPublisher.publishConnectionStatus('connected')
      }

      // Subscribe to symbols
      const binanceSymbols = validSymbols
        .map(symbol => this.symbolMapping.getBinanceSymbol(symbol))
        .filter(Boolean) as string[]

      await this.streamService.subscribe(binanceSymbols)
      connectedSymbols.push(...validSymbols)
      
      this.isRunning = true

      return {
        success: true,
        connectedSymbols,
        errors,
        streamStatus: 'connected'
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`Stream connection failed: ${errorMessage}`)
      
      await this.eventPublisher.publishConnectionStatus('disconnected')

      return {
        success: false,
        connectedSymbols,
        errors,
        streamStatus: 'failed'
      }
    }
  }

  async stop(): Promise<void> {
    if (this.isRunning) {
      await this.streamService.disconnect()
      await this.eventPublisher.publishConnectionStatus('disconnected')
      this.isRunning = false
    }
  }

  isStreamRunning(): boolean {
    return this.isRunning && this.streamService.isConnected()
  }

  private setupEventHandlers(enableCaching: boolean, cacheTtl: number): void {
    // Handle price updates
    this.streamService.onPriceUpdate(async (priceData: PriceData) => {
      try {
        // Cache the price data if enabled
        if (enableCaching) {
          await this.cacheRepository.set(priceData.symbol, priceData, cacheTtl)
        }

        // Publish price update event
        await this.eventPublisher.publishPriceUpdate(priceData)

      } catch (error) {
      }
    })

    // Handle stream errors
    this.streamService.onError(async (error: Error) => {
      await this.eventPublisher.publishConnectionStatus('reconnecting')
    })

    // Handle reconnections
    this.streamService.onReconnect(async () => {
      await this.eventPublisher.publishConnectionStatus('connected')
    })
  }
}