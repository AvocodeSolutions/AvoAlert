import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function GET() {
  try {
    const items = await redis.lrange<string>('q:signal:enqueued', 0, 49)
    const parsed = items
      .map((x) => {
        try { return JSON.parse(x) } catch { return null }
      })
      .filter(Boolean)
    return NextResponse.json({ ok: true, items: parsed })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'cannot_fetch_enqueued' }, { status: 500 })
  }
}


