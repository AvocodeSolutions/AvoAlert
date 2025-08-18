import { Router } from 'express'
import { redis } from '../../infrastructure/queue/upstash'
import { randomUUID } from 'crypto'
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




// ---------- Notification System Endpoints ----------
adminRouter.get('/notifications', async (req, res) => {
  try {
    const items = await redis.lrange('admin:notifications', 0, 49)
    const parsed = items.map((x) => safeParse(x)).filter(Boolean) as any[]
    res.json({ ok: true, items: parsed })
  } catch {
    res.status(500).json({ ok: false, error: 'cannot_fetch_notifications' })
  }
})

adminRouter.post('/clear-notifications', async (req, res) => {
  await redis.del('admin:notifications')
  res.json({ ok: true })
})

// Get triggered alarms
adminRouter.get('/triggered-alarms', async (req, res) => {
  try {
    const items = await redis.lrange('triggered_alarms', 0, 49)
    const parsed = items.map((x) => safeParse(x)).filter(Boolean) as any[]
    res.json({ ok: true, items: parsed })
  } catch {
    res.status(500).json({ ok: false, error: 'cannot_fetch_triggered_alarms' })
  }
})

// ---------- Queue monitoring (for monitoring page) ----------
adminRouter.get('/queue-stats', async (_req, res) => {
  try {
    const [qSignal, processed, notifications, enqueued] = await Promise.all([
      redis.llen('q:signal').catch(() => 0),
      redis.llen('q:signal:processed').catch(() => 0),
      redis.llen('admin:notifications').catch(() => 0),
      redis.llen('q:signal:enqueued').catch(() => 0),
    ])
    res.json({ ok: true, qSignal, processed, notifications, enqueued })
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

adminRouter.get('/queue-peek', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 20), 100)
    const raw = await redis.lrange('q:signal', -limit, -1)
    const items = raw
      .map((x) => safeParse(x))
      .filter(Boolean)
    res.json({ ok: true, items })
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

adminRouter.get('/enqueued', async (_req, res) => {
  try {
    const itemsRaw = await redis.lrange('q:signal:enqueued', 0, 49)
    const items = itemsRaw.map((x) => safeParse(x)).filter(Boolean)
    res.json({ ok: true, items })
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message })
  }
})

// ---------- Presets CRUD ----------
// item: { id, name, indicator: 'utbot', version: number, params: object, active: boolean }
adminRouter.get('/presets', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('presets').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, items: data })
})

adminRouter.post('/presets', async (req, res) => {
  const { name, indicator = 'utbot', indicator_id: indicatorIdBody = null, version = 1, params = {}, active = true } = req.body || {}
  if (!name) return res.status(400).json({ ok: false, error: 'name required' })
  // Resolve indicator_id (DB NOT NULL)
  let indicator_id: string | null = indicatorIdBody
  if (!indicator_id) {
    const { data: ind, error: indErr } = await supabaseAdmin
      .from('indicators')
      .select('id')
      .eq('key', indicator)
      .maybeSingle()
    if (indErr) return res.status(500).json({ ok: false, error: indErr.message })
    indicator_id = ind?.id ?? null
  }
  if (!indicator_id) return res.status(400).json({ ok: false, error: 'indicator_id_required' })
  const id = randomUUID()
  const { error } = await supabaseAdmin.from('presets').insert({ id, name, indicator, indicator_id, version, params, active })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.status(201).json({ ok: true, id })
})

adminRouter.put('/presets/:id', async (req, res) => {
  const { id } = req.params
  const body = { ...req.body }
  // Maintain indicator_id consistency if only indicator key provided
  if (!body.indicator_id && body.indicator) {
    const { data: ind, error: indErr } = await supabaseAdmin
      .from('indicators')
      .select('id')
      .eq('key', body.indicator)
      .maybeSingle()
    if (indErr) return res.status(500).json({ ok: false, error: indErr.message })
    if (ind?.id) body.indicator_id = ind.id
  }
  const { error } = await supabaseAdmin.from('presets').update(body).eq('id', id)
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

// ---------- Indicators CRUD ----------
// item: { id, name, key, pine_template?: string, default_params?: object, active: boolean }
adminRouter.get('/indicators', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('indicators').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, items: data })
})

adminRouter.post('/indicators', async (req, res) => {
  const { name, key, pine_template = '', default_params = {}, active = true } = req.body || {}
  if (!name || !key) return res.status(400).json({ ok: false, error: 'name_and_key_required' })
  const id = randomUUID()
  const { error } = await supabaseAdmin
    .from('indicators')
    .insert({ id, name, key, pine_template, default_params, active })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.status(201).json({ ok: true, id })
})

adminRouter.put('/indicators/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('indicators').update(req.body).eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

adminRouter.delete('/indicators/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('indicators').delete().eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

// ---------- Coins CRUD ----------
// item: { id, symbol, exchange, base, quote, display_name, active }
adminRouter.get('/coins', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('coins').select('*').order('symbol', { ascending: true })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, items: data })
})

adminRouter.post('/coins', async (req, res) => {
  const { symbol, exchange = 'BINANCE', base = null, quote = null, display_name = null, active = true } = req.body || {}
  if (!symbol) return res.status(400).json({ ok: false, error: 'symbol_required' })
  const id = randomUUID()
  const { error } = await supabaseAdmin.from('coins').insert({ id, symbol, exchange, base, quote, display_name, active })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.status(201).json({ ok: true, id })
})

adminRouter.put('/coins/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('coins').update(req.body).eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

adminRouter.delete('/coins/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('coins').delete().eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

// ---------- Timeframes Master CRUD ----------
// item: { id, code, display_name, order_index, active }
adminRouter.get('/tf-master', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('timeframes_master').select('*').order('order_index', { ascending: true })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true, items: data })
})

adminRouter.post('/tf-master', async (req, res) => {
  const { code, display_name = null, order_index = 0, active = true } = req.body || {}
  if (!code) return res.status(400).json({ ok: false, error: 'code_required' })
  const id = randomUUID()
  const { error } = await supabaseAdmin.from('timeframes_master').insert({ id, code, display_name, order_index, active })
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.status(201).json({ ok: true, id })
})

adminRouter.put('/tf-master/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('timeframes_master').update(req.body).eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})

adminRouter.delete('/tf-master/:id', async (req, res) => {
  const { id } = req.params
  const { error } = await supabaseAdmin.from('timeframes_master').delete().eq('id', id)
  if (error) return res.status(500).json({ ok: false, error: error.message })
  res.json({ ok: true })
})





// ---------- Seed: Default UT Bot indicator (with Pine template) ----------
adminRouter.post('/seed-default-indicators', async (_req, res) => {
  try {
    // Check existing by key
    const { data: exists, error: selErr } = await supabaseAdmin
      .from('indicators')
      .select('id')
      .eq('key', 'utbot')
      .maybeSingle()
    if (selErr) return res.status(500).json({ ok: false, error: selErr.message })

    /* eslint-disable no-useless-escape */
    const utbotTemplate = `//@version=5
indicator("AvoAlert - UT Bot Alerts", overlay=true)

// Preset: {{PRESET_ID}} v{{PRESET_VERSION}}
{{SECRET_LINE}}
string indicatorKey = "{{INDICATOR_KEY}}"

// Inputs (from preset/default params)
a = {{PARAM:key}}        // Key Value (sensitivity)
c = {{PARAM:atr}}        // ATR Period
h = {{PARAM:h}}          // Signals from Heikin Ashi Candles

xATR  = ta.atr(c)
nLoss = a * xATR

src = h ? request.security(ticker.heikinashi(syminfo.tickerid), timeframe.period, close, barmerge.gaps_off, barmerge.lookahead_off) : close

var float xATRTrailingStop = 0.0
xATRTrailingStop := src > nz(xATRTrailingStop[1], 0) and src[1] > nz(xATRTrailingStop[1], 0) ? math.max(nz(xATRTrailingStop[1]), src - nLoss) :
   src < nz(xATRTrailingStop[1], 0) and src[1] < nz(xATRTrailingStop[1], 0) ? math.min(nz(xATRTrailingStop[1]), src + nLoss) : 
   src > nz(xATRTrailingStop[1], 0) ? src - nLoss : src + nLoss
 
pos = 0   
pos := src[1] < nz(xATRTrailingStop[1], 0) and src > nz(xATRTrailingStop[1], 0) ? 1 :
   src[1] > nz(xATRTrailingStop[1], 0) and src < nz(xATRTrailingStop[1], 0) ? -1 : nz(pos[1], 0)

ema1   = ta.ema(src,1)
above  = ta.crossover(ema1, xATRTrailingStop)
below  = ta.crossover(xATRTrailingStop, ema1)

buy  = src > xATRTrailingStop and above 
sell = src < xATRTrailingStop and below

plotshape(buy,  title = "Buy",  text = 'Buy',  style = shape.labelup,   location = location.belowbar, color= color.new(color.green,0), textcolor = color.white, size = size.tiny)
plotshape(sell, title = "Sell", text = 'Sell', style = shape.labeldown, location = location.abovebar, color= color.new(color.red,0),   textcolor = color.white, size = size.tiny)

// Classic alertcondition (UI) and webhook alert()
alertcondition(buy,  "UT Long",  "UT Long")
alertcondition(sell, "UT Short", "UT Short")

make_msg(action) =>
    ts   = str.tostring(time)
    sym  = syminfo.ticker
    tfp  = timeframe.period
    base = "{\"indicator\":\"" + indicatorKey + "\",\"symbol\":\"" + sym + "\",\"timeframe\":\"" + tfp + "\",\"action\":\"" + action + "\",\"presetId\":\"" + "{{PRESET_ID}}" + "\",\"presetVersion\":" + str.tostring({{PRESET_VERSION}}) + ",\"ts\":\"" + ts + "\""
    sec != "" ? base + "{{SECRET_FIELD}}}" : base + "}"

if buy
    alert(make_msg("buy"), alert.freq_once_per_bar_close)
if sell
    alert(make_msg("sell"), alert.freq_once_per_bar_close)
`

    if (exists) {
      const { error: updErr } = await supabaseAdmin
        .from('indicators')
        .update({ name: 'UT Bot Alerts', pine_template: utbotTemplate, default_params: { key: 1, atr: 10, h: false }, active: true })
        .eq('id', exists.id)
      if (updErr) return res.status(500).json({ ok: false, error: updErr.message })
      return res.json({ ok: true, updated: true })
    } else {
      const id = randomUUID()
      const { error: insErr } = await supabaseAdmin
        .from('indicators')
        .insert({ id, name: 'UT Bot Alerts', key: 'utbot', pine_template: utbotTemplate, default_params: { key: 1, atr: 10, h: false }, active: true })
      if (insErr) return res.status(500).json({ ok: false, error: insErr.message })
      return res.status(201).json({ ok: true, inserted: true })
    }
  } catch (e) {
    return res.status(500).json({ ok: false, error: (e as Error).message })
  }
})



