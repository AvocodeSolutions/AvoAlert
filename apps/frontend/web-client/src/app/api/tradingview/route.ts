import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { z } from 'zod'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const schema = z.object({
  symbol: z.string().min(1),
  timeframe: z.enum(['1m', '5m', '15m', '1h', '4h', '1d']),
  action: z.enum(['buy', 'sell']),
  timestamp: z.union([z.string().datetime({ offset: true }), z.number(), z.string().regex(/^\d+$/)]),
  secret: z.string().min(8),
  source: z.string().optional(),
})

function toIsoTimestamp(input: string | number): string {
  if (typeof input === 'number') {
    const ms = input > 1e12 ? input : input * 1000
    return new Date(ms).toISOString()
  }
  if (/^\d+$/.test(input)) {
    const n = Number(input)
    const ms = n > 1e12 ? n : n * 1000
    return new Date(ms).toISOString()
  }
  return input
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.json().catch(() => ({}))
    if (!raw.timestamp && raw.ts) raw.timestamp = raw.ts
    const parse = schema.safeParse(raw)
    if (!parse.success) {
      return NextResponse.json({ ok: false, error: 'validation_error', details: parse.error.issues }, { status: 400 })
    }
    const { symbol, timeframe, action, timestamp, secret } = parse.data

    if (!process.env.TRADINGVIEW_WEBHOOK_SECRET || secret !== process.env.TRADINGVIEW_WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false, error: 'invalid_secret' }, { status: 401 })
    }

    const normalizedSymbol = symbol.includes(':') ? symbol.split(':')[1] : String(symbol).replace('/', '')
    const timestampIso = toIsoTimestamp(timestamp as any)
    const idempotencyKey = `${normalizedSymbol}:${timeframe}:${timestampIso}:${action}`

    try {
      const setResult = await redis.set(`idemp:${idempotencyKey}`, '1', { nx: true, ex: 300 })
      if (setResult !== 'OK') {
        return NextResponse.json({ ok: false, error: 'duplicate_signal', idempotencyKey }, { status: 409 })
      }
    } catch {
      // ignore redis idempotency failure
    }

    const payload = { symbol: normalizedSymbol, timeframe, action, timestamp: timestampIso }
    // enqueue
    await redis.rpush('q:signal', JSON.stringify(payload))
    await redis.lpush('q:signal:enqueued', JSON.stringify({ ...payload, enqueuedAt: new Date().toISOString() }))
    await redis.ltrim('q:signal:enqueued', 0, 99)

    return NextResponse.json({ ok: true, source: 'tradingview', idempotencyKey }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 })
  }
}


