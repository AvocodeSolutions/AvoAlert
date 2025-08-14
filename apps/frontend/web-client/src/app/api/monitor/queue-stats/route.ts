import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function GET() {
  try {
    const [qSignal, processed, notifications, enqueued] = await Promise.all([
      redis.llen('q:signal').catch(() => 0),
      redis.llen('q:signal:processed').catch(() => 0),
      redis.llen('admin:notifications').catch(() => 0),
      redis.llen('q:signal:enqueued').catch(() => 0),
    ])
    return NextResponse.json({ ok: true, qSignal, processed, notifications, enqueued })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'cannot_fetch_stats' }, { status: 500 })
  }
}


