import { loadEnv } from '../shared/load-env'
loadEnv()
import { redis } from '../infrastructure/queue/upstash'

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
        await sleep(2000) // Increased from 500ms to 2s to reduce Redis requests
        continue
      }
      const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
      const signal = JSON.parse(raw)
      console.log('[signal-worker] Processing signal:', signal)
      
      // Push to processed list for notification worker to consume
      await redis.lpush('q:signal:processed', JSON.stringify({
        processedAt: new Date().toISOString(),
        ...signal,
      }))
      await redis.ltrim('q:signal:processed', 0, 99)
      
      console.log('[signal-worker] Signal pushed to processed queue for notification worker')
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


