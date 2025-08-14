import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function GET() {
  try {
    const items = await redis.lrange('q:signal:enqueued', 0, 49)
    console.log('Enqueued items raw:', items)
    const parsed = items
      .map((x) => {
        try { 
          const item = typeof x === 'string' ? JSON.parse(x) : x
          return item
        } catch { 
          return null 
        }
      })
      .filter(Boolean)
    console.log('Enqueued items parsed:', parsed)
    return NextResponse.json({ ok: true, items: parsed })
  } catch (e) {
    console.error('Enqueued API error:', e)
    return NextResponse.json({ ok: false, error: 'cannot_fetch_enqueued' }, { status: 500 })
  }
}


