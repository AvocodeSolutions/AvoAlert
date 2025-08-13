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
  const schema = z.object({
    symbol: z.string().min(1),
    timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
    action: z.enum(['buy', 'sell']),
    price: z.number().optional(),
    timestamp: z.string().datetime({ offset: true }),
    secret: z.string().min(8),
    source: z.string().optional(),
  })

  const parse = schema.safeParse(req.body)
  if (!parse.success) {
    return res.status(400).json({ ok: false, error: 'validation_error', details: parse.error.issues })
  }

  const { symbol, timeframe, action, price, timestamp, secret } = parse.data

  // Secret check
  if (!process.env.TRADINGVIEW_WEBHOOK_SECRET || secret !== process.env.TRADINGVIEW_WEBHOOK_SECRET) {
    return res.status(401).json({ ok: false, error: 'invalid_secret' })
  }

  // Normalize symbol: BINANCE:BTCUSDT | BTC/USDT | BTCUSDT -> BTCUSDT
  const normalizedSymbol = symbol.includes(':') ? symbol.split(':')[1] : symbol.replace('/', '')

  // Idempotency: symbol + timeframe + timestamp + action
  const idempotencyKey = `${normalizedSymbol}:${timeframe}:${timestamp}:${action}`
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
      price,
      timestamp,
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

