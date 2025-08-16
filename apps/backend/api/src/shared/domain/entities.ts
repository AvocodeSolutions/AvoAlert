// Database entities - Supabase schema'ya göre
export interface UserAlarm {
  id: number
  email: string
  coin_symbol: string
  timeframe: string
  is_active: boolean
  created_at: string
  updated_at: string
  action: 'buy' | 'sell'
}

export interface Coin {
  id: number
  symbol: string
  exchange: string
  fee: number
  active: boolean
  display_name: string
  created_at: string
  updated_at: string
}

export interface TradingSignal {
  symbol: string
  timeframe: string
  action: 'buy' | 'sell'
  price: number
  timestamp: string
}

export interface Preset {
  id: number
  name: string
  indicator: string
  version: string
  params: Record<string, any>
  active: boolean
  created_at: string
  updated_at: string
}

export interface Assignment {
  id: number
  symbol: string
  timeframe: string
  preset_id: number
  status: string
  updated_at: string
}