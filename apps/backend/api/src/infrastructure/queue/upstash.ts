import { loadEnv } from '../../shared/load-env'
loadEnv()
import { Redis } from '@upstash/redis'

export function createRedisClient(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set')
  }
  return new Redis({ url, token })
}

export const redis = createRedisClient()


