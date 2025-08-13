export interface TradingSignal {
  symbol: string
  timeframe: string
  action: 'buy' | 'sell'
  timestamp: string
}

