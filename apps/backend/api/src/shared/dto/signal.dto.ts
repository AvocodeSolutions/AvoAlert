import { z } from 'zod'

// TradingView Webhook Schema
export const TradingViewWebhookSchema = z.object({
  symbol: z.string().min(1),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
  action: z.enum(['buy', 'sell']),
  price: z.number().positive().optional(),
  timestamp: z.union([
    z.string().datetime({ offset: true }), 
    z.number(), 
    z.string().regex(/^\d+$/)
  ]),
  secret: z.string().min(8),
  source: z.string().optional()
})

export type TradingViewWebhookRequest = z.infer<typeof TradingViewWebhookSchema>

// Signal Processing Schema
export const SignalIngestSchema = z.object({
  symbol: z.string().min(1),
  timeframe: z.string().min(1),
  action: z.enum(['buy', 'sell']),
  timestamp: z.string()
})

export type SignalIngestRequest = z.infer<typeof SignalIngestSchema>

// Response DTOs
export interface SignalResponse {
  ok: boolean
  source?: string
  idempotencyKey?: string
  error?: string
  details?: any
}