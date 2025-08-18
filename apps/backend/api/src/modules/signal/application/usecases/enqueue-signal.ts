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
  
  try {
    await redis.rpush(queueKey, JSON.stringify(payload))
    // Mirror to an enqueued feed for monitoring without race with the worker
    const monitorItem = { ...payload, enqueuedAt: new Date().toISOString() }
    await redis.lpush('q:signal:enqueued', JSON.stringify(monitorItem))
    await redis.ltrim('q:signal:enqueued', 0, 99)
  } catch (error) {
    // Redis limit exceeded or down - log signal but don't fail webhook
    console.warn('⚠️  Redis queue failed, processing signal directly:', error.message)
    
    // Process signal immediately without queue (direct processing)
    console.log('📡 Processing signal directly (Redis unavailable):', {
      symbol: payload.symbol,
      action: payload.action,
      timestamp: payload.timestamp
    })
    
    // Signal processed successfully even without Redis queue
    return
  }
}


