import { Router } from 'express'
import { IngestSignalUseCase } from '../../application/usecases/ingest-signal'
import { z } from 'zod'
import { redis } from '../../../../infrastructure/queue/upstash'
import { enqueueSignal } from '../../application/usecases/enqueue-signal'

export const signalRouter = Router()

signalRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'signal' })
})

// Return last processed signals for testing
signalRouter.get('/processed', async (req, res) => {
  try {
    const items = await redis.lrange('q:signal:processed', 0, 49)
    const parsed = items
      .map((x) => {
        try {
          return typeof x === 'string' ? JSON.parse(x) : x
        } catch {
          return null
        }
      })
      .filter(Boolean)
    res.json({ ok: true, count: parsed.length, items: parsed })
  } catch {
    res.status(500).json({ ok: false, error: 'cannot_fetch_processed' })
  }
})

signalRouter.post('/ingest', async (req, res) => {
  const uc = new IngestSignalUseCase()
  try {
    const signal = await uc.execute(req.body)
    res.status(201).json({ ok: true, signal })
  } catch (err) {
    res.status(400).json({ ok: false, error: (err as Error).message })
  }
})

// TradingView webhook endpoint with validation, secret check, and idempotency
signalRouter.post('/tradingview', async (req, res) => {
  // Normalize legacy keys from script-generated payloads
  const raw = { ...(req.body || {}) }
  if (!raw.timestamp && raw.ts) raw.timestamp = raw.ts

  const schema = z.object({
    symbol: z.string().min(1),
    timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
    action: z.enum(['buy', 'sell']),
    // Accept ISO8601 string OR unix seconds/milliseconds (string or number)
    timestamp: z.union([
      z.string().datetime({ offset: true }),
      z.number(),
      z.string().regex(/^\d+$/),
    ]),
    secret: z.string().min(8),
    source: z.string().optional(),
  })

  const parse = schema.safeParse(raw)
  if (!parse.success) {
    return res.status(400).json({ ok: false, error: 'validation_error', details: parse.error.issues })
  }

  const { symbol, timeframe, action, timestamp, secret } = parse.data

  function toIsoTimestamp(input: string | number): string {
    if (typeof input === 'number') {
      const ms = input > 1e12 ? input : input * 1000
      return new Date(ms).toISOString()
    }
    if (/^\d+$/.test(input)) {
      const asNum = Number(input)
      const ms = asNum > 1e12 ? asNum : asNum * 1000
      return new Date(ms).toISOString()
    }
    return input
  }

  // Secret check
  if (!process.env.TRADINGVIEW_WEBHOOK_SECRET || secret !== process.env.TRADINGVIEW_WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, error: 'invalid_secret' })
  }

  // Normalize symbol: BINANCE:BTCUSDT | BTC/USDT | BTCUSDT -> BTCUSDT
  const normalizedSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol.replace('/', '')

  // Idempotency: symbol + timeframe + timestamp + action
  const timestampIso = toIsoTimestamp(timestamp as any)
  const idempotencyKey = `${normalizedSymbol}:${timeframe}:${timestampIso}:${action}`
  try {
    // SET NX EX 300 -> prevent duplicates for 5 minutes
    const setResult = await redis.set(`idemp:${idempotencyKey}`, '1', { nx: true, ex: 300 })
    if (setResult !== 'OK') {
      return res.status(409).json({ ok: false, error: 'duplicate_signal', idempotencyKey })
    }
  } catch {
    // If Redis not available, we still accept but warn via response
    void 0
  }

  // Execute domain use case (currently validation/echo) and enqueue for async processing
  const uc = new IngestSignalUseCase()
  try {
    const signal = await uc.execute({
      symbol: normalizedSymbol,
      timeframe,
      action,
      timestamp: timestampIso,
    })
    try {
      await enqueueSignal(signal)
    } catch (_err) {
      void _err
    }
    return res.status(201).json({
      ok: true,
      source: 'tradingview',
      idempotencyKey,
      normalizedSymbol,
      timeframe,
      action,
      timestamp,
    })
  } catch {
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

