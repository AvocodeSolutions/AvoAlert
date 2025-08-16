export interface TradingSignal {
  symbol: string
  timeframe: string
  action: 'buy' | 'sell'
  price: number
  timestamp: string
}

