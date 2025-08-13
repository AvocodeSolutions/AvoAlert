import { redis } from '../../../../infrastructure/queue/upstash'

export interface EnqueueSignalPayload {
  symbol: string
  timeframe: string
  action: 'buy' | 'sell'
  timestamp: string
}

// Minimal queue producer: pushes raw signal into a Redis list for a worker to consume.
export async function enqueueSignal(payload: EnqueueSignalPayload): Promise<void> {
  const queueKey = `q:signal` // could be sharded by symbol/timeframe if needed
  await redis.rpush(queueKey, JSON.stringify(payload))
  // Mirror to an enqueued feed for monitoring without race with the worker
  const monitorItem = { ...payload, enqueuedAt: new Date().toISOString() }
  await redis.lpush('q:signal:enqueued', JSON.stringify(monitorItem))
  await redis.ltrim('q:signal:enqueued', 0, 99)
}


