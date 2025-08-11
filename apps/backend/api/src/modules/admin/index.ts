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


