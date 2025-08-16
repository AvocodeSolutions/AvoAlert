import { z } from 'zod'

// Request DTOs
export const CreateAlarmRequestSchema = z.object({
  email: z.string().email(),
  coin_symbol: z.string().min(1),
  timeframe: z.string().min(1),
  action: z.enum(['buy', 'sell'])
})

export const GetAlarmsRequestSchema = z.object({
  email: z.string().email()
})

export type CreateAlarmRequest = z.infer<typeof CreateAlarmRequestSchema>
export type GetAlarmsRequest = z.infer<typeof GetAlarmsRequestSchema>

// Response DTOs
export interface AlarmResponse {
  id: number
  email: string
  coin_symbol: string
  timeframe: string
  action: 'buy' | 'sell'
  is_active: boolean
  created_at: string
}

export interface CoinResponse {
  id: number
  symbol: string
  display_name: string
  exchange: string
  active: boolean
}

export interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  message?: string
}