import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { Redis } from '@upstash/redis'

// Lazy clients - will be created when first accessed
let redisClient: Redis | null = null
let supabaseClient: any = null

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  }
  return redisClient
}

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return supabaseClient
}

export const notificationRouter = Router()

notificationRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'notification' })
})

// ---------- User Alarms CRUD ----------
// Get user alarms by email
notificationRouter.get('/user-alarms', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({ ok: false, error: 'email_required' })
    }
    
    const { data, error } = await getSupabase()
      .from('user_alarms')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) return res.status(500).json({ ok: false, error: error.message })
    res.json({ ok: true, alarms: data })
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

// Create user alarm
notificationRouter.post('/user-alarms', async (req, res) => {
  try {
    const { email, coin_symbol, action = 'buy' } = req.body || {}
    
    if (!email || !coin_symbol || !action) {
      return res.status(400).json({ ok: false, error: 'email_coin_symbol_and_action_required' })
    }

    // Validate action
    if (!['buy', 'sell'].includes(action)) {
      return res.status(400).json({ ok: false, error: 'invalid_action_must_be_buy_or_sell' })
    }

    // Check if alarm already exists with same coin + action
    const { data: existing } = await getSupabase()
      .from('user_alarms')
      .select('id')
      .eq('email', email)
      .eq('coin_symbol', coin_symbol)
      .eq('action', action)
      .eq('is_active', true)
      .single()

    if (existing) {
      return res.status(400).json({ 
        ok: false, 
        error: 'alarm_exists',
        message: `Bu coin için ${action} tipinde zaten aktif alarm var!` 
      })
    }

    // Verify coin exists
    const { data: coin } = await getSupabase()
      .from('coins')
      .select('symbol')
      .eq('symbol', coin_symbol)
      .eq('active', true)
      .single()

    if (!coin) {
      return res.status(400).json({ 
        ok: false, 
        error: 'coin_not_found',
        message: 'Geçersiz coin!' 
      })
    }

    // Create alarm
    const { data: alarm, error } = await getSupabase()
      .from('user_alarms')
      .insert([{
        email,
        coin_symbol,
        action,
        is_active: true
      }])
      .select()
      .single()

    if (error) return res.status(500).json({ ok: false, error: error.message })
    res.status(201).json({ ok: true, alarm })
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

// Delete (deactivate) user alarm
notificationRouter.delete('/user-alarms/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({ ok: false, error: 'id_required' })
    }

    const { error } = await getSupabase()
      .from('user_alarms')
      .update({ is_active: false })
      .eq('id', id)

    if (error) return res.status(500).json({ ok: false, error: error.message })
    res.json({ ok: true })
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

// Get triggered alarms for user
notificationRouter.get('/triggered-alarms', async (req, res) => {
  try {
    const { email } = req.query
    if (!email) {
      return res.status(400).json({ ok: false, error: 'email_required' })
    }

    // Read triggered alarms from Redis
    const items = await getRedis().lrange('triggered_alarms', 0, 99)
    const parsed = items
      .map((x) => {
        try { 
          const item = typeof x === 'string' ? JSON.parse(x) : x
          return item
        } catch { 
          return null 
        }
      })
      .filter(Boolean)
      .filter((item: any) => item.email === email) // Filter by user email
      .slice(0, 20) // Latest 20 for this user

    res.json({ ok: true, triggered: parsed })
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

