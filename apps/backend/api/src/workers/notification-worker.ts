import { loadEnv } from '../shared/load-env'
loadEnv()
import { redis } from '../infrastructure/queue/upstash'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface Signal {
  symbol: string
  timeframe: string
  action: string
  timestamp: string
}

async function runNotificationWorker() {
  const queueKey = 'q:signal:processed' // Notification worker reads from processed signals
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
  
  console.log('[notification-worker] Starting notification worker...')
  
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      // Pop from processed signals queue
      const payload = await redis.rpop(queueKey)
      if (!payload) {
        await sleep(1000) // Wait longer for notifications
        continue
      }

      const raw = typeof payload === 'string' ? payload : JSON.stringify(payload)
      const signal: Signal = JSON.parse(raw)
      
      console.log('[notification-worker] Processing signal for notifications:', signal)

      // Find active user alarms for this exact coin symbol
      const { data: userAlarms, error } = await supabaseAdmin
        .from('user_alarms')
        .select('*')
        .eq('coin_symbol', signal.symbol)
        .eq('is_active', true)

      if (error) {
        console.error('[notification-worker] Error fetching user alarms:', error)
        continue
      }

      if (!userAlarms || userAlarms.length === 0) {
        console.log(`[notification-worker] No active alarms found for ${signal.symbol}`)
        continue
      }

      console.log(`[notification-worker] Found ${userAlarms.length} active alarms for ${signal.symbol}`)

      // Process each user alarm
      for (const alarm of userAlarms) {
        try {
          // TODO: Send actual email here (Resend/SendGrid integration)
          console.log(`[notification-worker] Would send email to ${alarm.email} for ${signal.symbol} ${signal.action}`)

          // Create triggered alarm record
          const triggeredAlarm = {
            id: `${alarm.email}-${signal.symbol}-${signal.timestamp}`, // Unique ID
            email: alarm.email,
            coin_symbol: signal.symbol,
            timeframe: signal.timeframe,
            action: signal.action,
            signal_timestamp: signal.timestamp,
            triggered_at: new Date().toISOString()
          }

          // Save to triggered_alarms table (we need to create this table)
          // For now, push to Redis for the frontend to read
          await redis.lpush('triggered_alarms', JSON.stringify(triggeredAlarm))
          await redis.ltrim('triggered_alarms', 0, 99) // Keep latest 100

          // Also save to admin notifications for monitoring
          const notification = {
            deliveredAt: new Date().toISOString(),
            userId: 'user_' + alarm.email.split('@')[0],
            email: alarm.email,
            channel: 'email',
            symbol: signal.symbol,
            timeframe: signal.timeframe,
            action: signal.action,
            status: 'sent' // TODO: Change to 'pending' when real email integration
          }

          await redis.lpush('admin:notifications', JSON.stringify(notification))
          await redis.ltrim('admin:notifications', 0, 199)

          console.log(`[notification-worker] Processed alarm for ${alarm.email}`)
        } catch (err) {
          console.error(`[notification-worker] Error processing alarm for ${alarm.email}:`, err)
        }
      }

      console.log(`[notification-worker] Completed processing signal ${signal.symbol}`)
    } catch (err) {
      console.error('[notification-worker] error:', err)
      await sleep(2000)
    }
  }
}

runNotificationWorker().catch((e) => {
  console.error('notification worker failed to start', e)
  process.exit(1)
})
