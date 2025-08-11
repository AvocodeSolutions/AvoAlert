import { redis } from '../../../../infrastructure/queue/upstash'

export interface EnqueueSignalPayload {
  symbol: string
  timeframe: string
  action: 'buy' | 'sell'
  price: number
  timestamp: string
}

// Minimal queue producer: pushes raw signal into a Redis list for a worker to consume.
export async function enqueueSignal(payload: EnqueueSignalPayload): Promise<void> {
  const queueKey = `q:signal` // could be sharded by symbol/timeframe if needed
  await redis.rpush(queueKey, JSON.stringify(payload))
}


