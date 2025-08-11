import { Router } from 'express'
import { redis } from '../../infrastructure/queue/upstash'
import { randomUUID } from 'crypto'
import { enqueueSignal } from '../signal/application/usecases/enqueue-signal'
import { IngestSignalUseCase } from '../signal/application/usecases/ingest-signal'
import { supabaseAdmin } from '../../infrastructure/supabase/client'

export const adminRouter = Router()

function safeParse<T = any>(value: unknown): T | null {
  try {
    if (typeof value === 'string') return JSON.parse(value) as T
    return (value as T) ?? null
  } catch {
    return null
  }
}

// Seed dummy users (for demo)
adminRouter.post('/seed-users', async (req, res) => {
  const num = Number(req.query.count || 5)
  const users = Array.from({ length: num }).map(() => ({
    id: randomUUID(),
    email: `${Math.random().toString(36).slice(2, 8)}@demo.local`,
    channels: ['email'],
    createdAt: new Date().toISOString(),
  }))
  await redis.del('admin:users')
  if (users.length) {
    await redis.lpush('admin:users', ...users.map((u) => JSON.stringify(u)))
  }
  res.json({ ok: true, count: users.length })
})

// Supabase Auth: Seed dummy users via admin API (email_confirmed:true)
adminRouter.post('/seed-users-supabase', async (req, res) => {
  try {
    const num = Number(req.query.count || 5)
    const created: any[] = []
    for (let i = 0; i < num; i++) {
      const email = `${Math.random().toString(36).slice(2, 10)}@demo.local`
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: randomUUID(),
        email_confirm: true,
        user_metadata: { seeded: true },
      } as any)
      if (error) throw error
      created.push({ id: data.user?.id, email: data.user?.email })
    }
    res.json({ ok: true, users: created })
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

adminRouter.get('/users-supabase', async (req, res) => {
  try {
    const { data, error } = await (supabaseAdmin.auth.admin as any).listUsers()
    if (error) throw error
    const users = (data?.users || []).map((u: any) => ({ id: u.id, email: u.email }))
    res.json({ ok: true, users })
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

adminRouter.post('/clear-users-supabase', async (req, res) => {
  try {
    const { data, error } = await (supabaseAdmin.auth.admin as any).listUsers()
    if (error) throw error
    const users: any[] = data?.users || []
    for (const u of users) {
      if (u?.email?.endsWith('@demo.local')) {
        await supabaseAdmin.auth.admin.deleteUser(u.id)
      }
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

adminRouter.get('/users', async (req, res) => {
  try {
    const items = await redis.lrange('admin:users', 0, -1)
    const users = items.map((x) => safeParse(x)).filter(Boolean)
    res.json({ ok: true, users })
  } catch (e) {
    res.status(500).json({ ok: false, error: 'cannot_fetch_users' })
  }
})

adminRouter.post('/clear-users', async (req, res) => {
  await redis.del('admin:users')
  res.json({ ok: true })
})

adminRouter.get('/notifications', async (req, res) => {
  try {
    const items = await redis.lrange('admin:notifications', 0, 49)
    const parsed = items.map((x) => safeParse(x)).filter(Boolean) as any[]
    // join with users for richer detail
    const usersRaw = await redis.lrange('admin:users', 0, -1)
    const users = usersRaw.map((x) => safeParse(x)).filter(Boolean) as any[]
    const userById = new Map(users.map((u: any) => [u.id, u]))
    const enriched = parsed.map((d) => ({
      ...d,
      user: userById.get((d as any).userId) || null,
    }))
    res.json({ ok: true, items: enriched })
  } catch (e) {
    res.status(500).json({ ok: false, error: 'cannot_fetch_notifications' })
  }
})

adminRouter.post('/clear-notifications', async (req, res) => {
  await redis.del('admin:notifications')
  res.json({ ok: true })
})

// Simulate a signal without TradingView, for testing
adminRouter.post('/simulate-signal', async (req, res) => {
  try {
    const { symbol = 'BTCUSDT', timeframe = '15m', action = 'buy', price = 50000 } = req.body || {}
    const uc = new IngestSignalUseCase()
    const signal = await uc.execute({
      symbol: String(symbol),
      timeframe: String(timeframe),
      action: action === 'sell' ? 'sell' : 'buy',
      price: Number(price),
      timestamp: new Date().toISOString(),
    })
    await enqueueSignal(signal)
    return res.status(201).json({ ok: true, signal })
  } catch (e) {
    return res.status(400).json({ ok: false, error: (e as Error).message })
  }
})

adminRouter.post('/reset-all', async (req, res) => {
  await redis.del('admin:users')
  await redis.del('admin:notifications')
  await redis.del('q:signal:processed')
  res.json({ ok: true })
})

// ---------- Presets CRUD ----------
// item: { id, name, indicator: 'utbot', version: number, params: object, active: boolean }
adminRouter.get('/presets', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('presets').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, items: data })
})

adminRouter.post('/presets', async (req, res) => {
  const { name, indicator = 'utbot', version = 1, params = {}, active = true } = req.body || {}
  if (!name) return res.status(400).json({ ok: false, error: 'name required' })
  const id = randomUUID()
  const { error } = await supabaseAdmin.from('presets').insert({ id, name, indicator, version, params, active })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.status(201).json({ ok: true, id })
})

adminRouter.put('/presets/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('presets').update(req.body).eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

adminRouter.delete('/presets/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('presets').delete().eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

// ---------- Coin Groups CRUD ----------
// item: { id, name, symbols: string[] }
adminRouter.get('/groups', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('coin_groups').select('*').order('name', { ascending: true })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, items: data })
})

adminRouter.post('/groups', async (req, res) => {
  const { name, symbols } = req.body || {}
  if (!name || !Array.isArray(symbols)) return res.status(400).json({ ok: false, error: 'name_and_symbols_required' })
  const id = randomUUID()
  const { error } = await supabaseAdmin.from('coin_groups').insert({ id, name, symbols })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.status(201).json({ ok: true, id })
})

adminRouter.put('/groups/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('coin_groups').update(req.body).eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

adminRouter.delete('/groups/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('coin_groups').delete().eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

// ---------- Timeframe Sets CRUD ----------
// item: { id, name, timeframes: string[] }
adminRouter.get('/timeframes', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('timeframe_sets').select('*').order('name', { ascending: true })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, items: data })
})

adminRouter.post('/timeframes', async (req, res) => {
  const { name, timeframes } = req.body || {}
  if (!name || !Array.isArray(timeframes)) return res.status(400).json({ ok: false, error: 'name_and_timeframes_required' })
  const id = randomUUID()
  const { error } = await supabaseAdmin.from('timeframe_sets').insert({ id, name, timeframes })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.status(201).json({ ok: true, id })
})

adminRouter.put('/timeframes/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('timeframe_sets').update(req.body).eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

adminRouter.delete('/timeframes/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('timeframe_sets').delete().eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

// ---------- Assignments CRUD ----------
// item: { id, symbol, timeframe, preset_id, preset_version, status }
adminRouter.get('/assignments', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('assignments').select('*').order('updated_at', { ascending: false })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, items: data })
})

adminRouter.post('/assignments', async (req, res) => {
  const { symbol, timeframe, preset_id, preset_version, status = 'active' } = req.body || {}
  if (!symbol || !timeframe || !preset_id || typeof preset_version !== 'number') {
    return res.status(400).json({ ok: false, error: 'symbol_timeframe_preset_required' })
  }
  const id = randomUUID()
  const { error } = await supabaseAdmin.from('assignments').insert({ id, symbol, timeframe, preset_id, preset_version, status })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.status(201).json({ ok: true, id })
})

adminRouter.put('/assignments/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('assignments').update(req.body).eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

adminRouter.delete('/assignments/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('assignments').delete().eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

// ---------- Bulk assignment (group × timeframe set) ----------
adminRouter.post('/assignments/bulk', async (req, res) => {
  const { group_id, timeframe_set_id, preset_id, preset_version, status = 'active' } = req.body || {}
  if (!group_id || !timeframe_set_id || !preset_id || typeof preset_version !== 'number') {
    return res.status(400).json({ ok: false, error: 'group_timeframeSet_preset_required' })
  }
  const { data: g, error: ge } = await supabaseAdmin.from('coin_groups').select('symbols').eq('id', group_id).single()
  if (ge) return res.status(500).json({ ok: false, error: ge.message })
  const { data: t, error: te } = await supabaseAdmin.from('timeframe_sets').select('timeframes').eq('id', timeframe_set_id).single()
  if (te) return res.status(500).json({ ok: false, error: te.message })
  const symbols: string[] = g?.symbols || []
  const timeframes: string[] = t?.timeframes || []
  const rows = symbols.flatMap((symbol) => timeframes.map((timeframe) => ({ id: randomUUID(), symbol, timeframe, preset_id, preset_version, status })))
  if (rows.length === 0) return res.json({ ok: true, inserted: 0 })
  const { error } = await supabaseAdmin.from('assignments').insert(rows)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, inserted: rows.length })
})

// ---------- Export tasklist ----------
adminRouter.get('/export-tasklist', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('assignments').select('symbol,timeframe,preset_id,preset_version,status')
  if (error) return res.status(500).json({ ok: false, error: error.message })
  const tasklist = (data || [])
    .filter((a: any) => a.status !== 'paused')
    .map((a: any) => ({ symbol: a.symbol, timeframe: a.timeframe, presetId: a.preset_id, presetVersion: a.preset_version }))
  res.json({ ok: true, tasklist })
})

// ---------- Webhook info ----------
adminRouter.get('/webhook', async (_req, res) => {
  const urlBase = process.env.WEBHOOK_BASE_URL || ''
  const url = urlBase ? `${urlBase}/signals/tradingview` : '/signals/tradingview'
  res.json({ ok: true, url, secret: process.env.TRADINGVIEW_WEBHOOK_SECRET || '' })
})



