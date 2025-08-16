import { Redis } from '@upstash/redis'
// loadEnv() is called in src/app.ts entry point

let redisInstance: Redis | null = null

export function createRedisClient(): Redis {
  if (redisInstance) {
    return redisInstance
  }
  
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set')
  }
  
  redisInstance = new Redis({ url, token })
  return redisInstance
}

// Lazy getter for redis
export const redis = new Proxy({} as Redis, {
  get(target, prop) {
    const client = createRedisClient()
    return (client as any)[prop]
  }
})


