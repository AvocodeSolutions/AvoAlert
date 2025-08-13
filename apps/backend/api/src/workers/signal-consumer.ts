import { loadEnv } from '../shared/load-env'
loadEnv()
import { redis } from '../infrastructure/queue/upstash'
import { supabaseAdmin } from '../infrastructure/supabase/client'

// Minimal worker that pops from Redis list and logs
// In a real scenario, this would persist to DB and dispatch notifications

async function runWorker() {
  const queueKey = 'q:signal'
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // Polling pop; if empty, wait a bit
      const payload = await redis.rpop(queueKey as string)
      if (!payload) {
        await sleep(500)
        continue
      }
      const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
      const signal = JSON.parse(raw)
      // Simulate delivery to dummy users
      // Read recipients from Supabase Auth (seeded demo users)
      const { data } = await (supabaseAdmin.auth.admin as any).listUsers()
      const users = (data?.users || []).filter((u: any) => u?.email?.endsWith?.('@demo.local'))
      const deliveries = users.map((user: { id: string; email: string }) => ({
        deliveredAt: new Date().toISOString(),
        userId: user.id,
        email: user.email,
        channel: 'email',
        symbol: signal.symbol,
        timeframe: signal.timeframe,
        action: signal.action,
      }))
      if (deliveries.length) {
      await redis.lpush('admin:notifications', ...deliveries.map((d: unknown) => JSON.stringify(d)))
        await redis.ltrim('admin:notifications', 0, 199)
      }
      console.log('[worker] processed signal:', signal, 'deliveries:', deliveries.length)
      // push to processed list for testing/monitoring
      await redis.lpush('q:signal:processed', JSON.stringify({
        processedAt: new Date().toISOString(),
        ...signal,
      }))
      await redis.ltrim('q:signal:processed', 0, 99)
    } catch (err) {
      console.error('[worker] error:', err)
      await sleep(1000)
    }
  }
}

runWorker().catch((e) => {
  console.error('worker failed to start', e)
  process.exit(1)
})


