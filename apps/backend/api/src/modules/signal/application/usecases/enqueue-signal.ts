import { redis } from '../../../../infrastructure/queue/upstash'

export interface EnqueueSignalPayload {
  symbol: string
  timeframe: string
  action: 'buy' | 'sell'
  timestamp: string
  price: number
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
    // Redis limit exceeded or down - process signal immediately
    console.warn('⚠️  Redis queue failed, processing signal directly:', error.message)
    
    // DIRECT ALARM PROCESSING - trigger alarms immediately
    await processSignalDirectly(payload)
    return
  }
}

// Direct signal processing when Redis is unavailable
async function processSignalDirectly(payload: EnqueueSignalPayload) {
  try {
    const { supabaseAdmin } = await import('../../../../infrastructure/supabase/client')
    
    console.log('📡 Processing signal directly:', payload)
    
    // Get user alarms for this symbol and action
    const { data: alarms, error } = await supabaseAdmin
      .from('user_alarms')
      .select('*')
      .eq('coin_symbol', payload.symbol)
      .eq('action', payload.action)
      .eq('is_active', true)

    if (error) {
      console.error('Failed to fetch user alarms:', error)
      return
    }

    if (!alarms || alarms.length === 0) {
      console.log('No active alarms for', payload.symbol, payload.action)
      return
    }

    // Process triggered alarms and save to database
    for (const alarm of alarms) {
      console.log(`🚨 ALARM TRIGGERED: ${alarm.email} - ${payload.symbol} ${payload.action}`)
      
      // Save triggered alarm to database
      const triggeredData = {
        email: alarm.email,
        coin_symbol: payload.symbol,
        action: payload.action,
        price: payload.price,
        triggered_at: new Date().toISOString(),
        message: `${payload.symbol} ${payload.action} signal triggered`
      }
      
      // Save to Redis triggered alarms list for the frontend to read
      try {
        const { redis } = await import('../../../../infrastructure/queue/upstash')
        await redis.lpush('triggered_alarms', JSON.stringify(triggeredData))
        await redis.ltrim('triggered_alarms', 0, 99) // Keep latest 100
        console.log('✅ Triggered alarm saved to Redis:', triggeredData)
      } catch (redisError) {
        console.error('Failed to save triggered alarm to Redis:', redisError)
      }
      
      // Deactivate the alarm after triggering
      const { error: deactivateError } = await supabaseAdmin
        .from('user_alarms')
        .update({ is_active: false })
        .eq('id', alarm.id)

      if (deactivateError) {
        console.error(`Error deactivating alarm ${alarm.id}:`, deactivateError)
      } else {
        console.log(`✅ Alarm ${alarm.id} deactivated after triggering`)
      }
      
      // Send email notification
      try {
        const { createEmailService } = await import('../../../notification/infrastructure/email-service')
        const emailService = createEmailService()
        
        const emailResult = await emailService.sendAlarmTriggeredEmail({
          email: alarm.email,
          coinSymbol: payload.symbol,
          action: payload.action as 'buy' | 'sell',
          timeframe: payload.timeframe,
          signalTime: payload.timestamp,
          notificationTime: new Date().toISOString()
        })

        if (emailResult.success) {
          console.log(`📧 ✅ Email sent successfully to ${alarm.email}, Message ID: ${emailResult.messageId}`)
        } else {
          console.error(`📧 ❌ Failed to send email to ${alarm.email}:`, emailResult.error)
        }
      } catch (emailError) {
        console.error('Failed to send email:', emailError)
      }
    }
    
  } catch (err) {
    console.error('Direct signal processing failed:', err)
  }
}


