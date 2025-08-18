/**
 * Binance WebSocket Stream Service
 * Handles real-time price updates from Binance API
 */

import WebSocket from 'ws'
import { PriceStreamService } from '../application/ports'
import { PriceData, PriceSubscription } from '../domain/entities'

interface BinanceTickerData {
  e: string      // Event type
  E: number      // Event time
  s: string      // Symbol
  c: string      // Close price
  P: string      // Price change percent
  v: string      // Total traded base asset volume
  h: string      // High price
  l: string      // Low price
}

export class BinanceStreamService implements PriceStreamService {
  private ws: WebSocket | null = null
  private subscription: PriceSubscription
  private priceCallbacks: ((data: PriceData) => void)[] = []
  private errorCallbacks: ((error: Error) => void)[] = []
  private reconnectCallbacks: (() => void)[] = []
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 5000 // Start with 5 seconds
  private heartbeatInterval: NodeJS.Timeout | null = null
  private isReconnecting = false

  constructor() {
    this.subscription = {
      symbols: [],
      isActive: false,
      lastHeartbeat: new Date(),
      reconnectCount: 0
    }
  }

  async connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return // Already connected
    }

    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        this.disconnect()

        // Create new WebSocket connection to Binance stream
        const baseUrl = 'wss://stream.binance.com:9443/ws'
        this.ws = new WebSocket(baseUrl)

        this.ws.on('open', () => {
          this.subscription.isActive = true
          this.subscription.lastHeartbeat = new Date()
          this.reconnectAttempts = 0
          this.isReconnecting = false
          
          this.startHeartbeat()
          resolve()
        })

        this.ws.on('message', (data: WebSocket.Data) => {
          try {
            this.handleMessage(data.toString())
          } catch (error) {
            this.notifyError(error as Error)
          }
        })

        this.ws.on('close', (code: number, reason: Buffer) => {
          this.subscription.isActive = false
          this.stopHeartbeat()
          
          if (!this.isReconnecting) {
            this.scheduleReconnect()
          }
        })

        this.ws.on('error', (error: Error) => {
          this.notifyError(error)
          reject(error)
        })

        this.ws.on('ping', (data: Buffer) => {
          this.ws?.pong(data)
          this.subscription.lastHeartbeat = new Date()
        })

      } catch (error) {
        reject(error)
      }
    })
  }

  async disconnect(): Promise<void> {
    this.isReconnecting = false
    this.stopHeartbeat()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    this.subscription.isActive = false
    this.subscription.symbols = []
  }

  async subscribe(symbols: string[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('WebSocket not connected')
    }

    // Convert symbols to Binance ticker stream format
    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`)
    
    const subscribeMessage = {
      method: 'SUBSCRIBE',
      params: streams,
      id: Date.now()
    }

    this.ws?.send(JSON.stringify(subscribeMessage))
    this.subscription.symbols = symbols
    
  }

  async unsubscribe(symbols: string[]): Promise<void> {
    if (!this.isConnected()) {
      return
    }

    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`)
    
    const unsubscribeMessage = {
      method: 'UNSUBSCRIBE',
      params: streams,
      id: Date.now()
    }

    this.ws?.send(JSON.stringify(unsubscribeMessage))
    
    // Remove from subscription
    this.subscription.symbols = this.subscription.symbols.filter(
      s => !symbols.includes(s)
    )
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.subscription.isActive
  }

  getSubscription(): PriceSubscription {
    return { ...this.subscription }
  }

  onPriceUpdate(callback: (data: PriceData) => void): void {
    this.priceCallbacks.push(callback)
  }

  onError(callback: (error: Error) => void): void {
    this.errorCallbacks.push(callback)
  }

  onReconnect(callback: () => void): void {
    this.reconnectCallbacks.push(callback)
  }

  private handleMessage(message: string): void {
    try {
      const data = JSON.parse(message)
      
      // Handle ticker data
      if (data.e === '24hrTicker') {
        const tickerData = data as BinanceTickerData
        const priceData = this.convertTickerToPriceData(tickerData)
        this.notifyPriceUpdate(priceData)
      }
      
      // Handle subscription confirmations
      if (data.result === null && data.id) {
      }
      
    } catch (error) {
    }
  }

  private convertTickerToPriceData(ticker: BinanceTickerData): PriceData {
    return {
      symbol: ticker.s,
      price: parseFloat(ticker.c),
      change24h: parseFloat(ticker.P),
      volume24h: parseFloat(ticker.v),
      high24h: parseFloat(ticker.h),
      low24h: parseFloat(ticker.l),
      lastUpdate: new Date(ticker.E),
      source: 'binance'
    }
  }

  private notifyPriceUpdate(data: PriceData): void {
    this.priceCallbacks.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
      }
    })
  }

  private notifyError(error: Error): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error)
      } catch (callbackError) {
      }
    })
  }

  private notifyReconnect(): void {
    this.reconnectCallbacks.forEach(callback => {
      try {
        callback()
      } catch (error) {
      }
    })
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.subscription.lastHeartbeat = new Date()
      }
    }, 30000) // Every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts || this.isReconnecting) {
      return
    }

    this.isReconnecting = true
    this.reconnectAttempts++
    this.subscription.reconnectCount++
    
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 60000)
    
    
    setTimeout(async () => {
      try {
        const symbolsToResubscribe = [...this.subscription.symbols]
        await this.connect()
        
        if (symbolsToResubscribe.length > 0) {
          await this.subscribe(symbolsToResubscribe)
        }
        
        this.notifyReconnect()
        
      } catch (error) {
        this.scheduleReconnect()
      }
    }, delay)
  }
}