import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(Number(searchParams.get('limit') || 20), 100)
    const items = await redis.lrange<string>('q:signal', -limit, -1)
    const parsed = items
      .map((x) => {
        try { return JSON.parse(x) } catch { return null }
      })
      .filter(Boolean)
    return NextResponse.json({ ok: true, items: parsed })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'cannot_fetch_queue_peek' }, { status: 500 })
  }
}


