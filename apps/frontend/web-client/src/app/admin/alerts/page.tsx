"use client"
import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://avoalert-api.onrender.com'

type Preset = { id: string; name: string; indicator: string; version: number; params: any; active: boolean }
type Indicator = { id: string; name: string; key: string; pine_template?: string; default_params?: any; active?: boolean }
type Group = { id: string; name: string; symbols: string[] }
type TFSet = { id: string; name: string; timeframes: string[] }
type Assign = { id: string; symbol: string; timeframe: string; preset_id: string; preset_version: number; status: string }
type Coin = { id: string; symbol: string; exchange?: string; base?: string|null; quote?: string|null; display_name?: string|null; active?: boolean }
type TFMaster = { id: string; code: string; display_name?: string|null; order_index?: number; active?: boolean }

export default function AlertsPanel() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [tfs, setTfs] = useState<TFSet[]>([])
  const [assigns, setAssigns] = useState<Assign[]>([])
  const [webhook, setWebhook] = useState<{ url: string; secret: string } | null>(null)
  const [presetEditId, setPresetEditId] = useState<string>("")
  const [presetScriptId, setPresetScriptId] = useState<string>("")
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [selectedIndicatorId, setSelectedIndicatorId] = useState<string>("")
  const [coins, setCoins] = useState<Coin[]>([])
  const [tfMaster, setTfMaster] = useState<TFMaster[]>([])
  const [loading, setLoading] = useState(false)

  // create form states
  const [newPreset, setNewPreset] = useState<{name:string; version:number; paramsText:string; active:boolean}>(
    { name: '', version: 1, paramsText: '{"key":2,"atr":18}', active: true }
  )
  const [newGroup, setNewGroup] = useState<{name:string; symbolsText:string}>({ name: '', symbolsText: 'BTCUSDT,AVAXUSDT' })
  const [newTF, setNewTF] = useState<{name:string; timeframesText:string}>({ name: '', timeframesText: '15m,1h,4h' })
  const [bulk, setBulk] = useState<{groupId:string; tfSetId:string; presetId:string; presetVersion:number}>(
    { groupId: '', tfSetId: '', presetId: '', presetVersion: 1 }
  )
  const [generatedScript, setGeneratedScript] = useState<string>('')
  type ParamType = 'number' | 'boolean'
  const [newIndicator, setNewIndicator] = useState<{name:string; key:string; template:string; params:{k:string; t:ParamType; v:string}[]}>(
    { name: '', key: '', template: '', params: [] }
  )
  const [indicatorEditModeNew, setIndicatorEditModeNew] = useState<boolean>(false)
  const [presetEditModeNew, setPresetEditModeNew] = useState<boolean>(false)
  const [newPresetIndicatorId, setNewPresetIndicatorId] = useState<string>('')
  // Preset params as flexible key/value rows, driven by selected indicator defaults
  const [presetParamRows, setPresetParamRows] = useState<{k:string; t:ParamType; v:string}[]>([])
  // Simple top-level tabs
  const [activeTab, setActiveTab] = useState<'presets' | 'indicators' | 'script' | 'groups'>('presets')
  // Expand controls for groups/tf lists
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [expandedTFSetId, setExpandedTFSetId] = useState<string | null>(null)

  const loadAll = async () => {
    const [p, g, t, a, w, i, c, tfm] = await Promise.all([
      fetch(`${API_BASE}/admin/presets`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/groups`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/timeframes`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/assignments`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/webhook`).then(r => r.json()).catch(() => ({ url: '', secret: '' })),
      fetch(`${API_BASE}/admin/indicators`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/coins`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/tf-master`).then(r => r.json()).catch(() => ({ items: [] })),
    ])
    setPresets(p.items || [])
    setGroups(g.items || [])
    setTfs(t.items || [])
    setAssigns(a.items || [])
    setWebhook({ url: w.url || '', secret: w.secret || '' })
    setIndicators(i.items || [])
    setCoins(c.items || [])
    setTfMaster(tfm.items || [])
    // Seçimler varsayılan olarak boş kalsın; kullanıcı açıkça seçsin
  }

  useEffect(() => { loadAll() }, [])

  const presetEdit = useMemo(() => presets.find(p => p.id === presetEditId) || null, [presets, presetEditId])
  const selectedPreset = useMemo(() => presets.find(p => p.id === presetScriptId) || null, [presets, presetScriptId])
  const selectedIndicator = useMemo(() => indicators.find(d => d.id === selectedIndicatorId) || null, [indicators, selectedIndicatorId])
  const canEditPreset = presetEditModeNew || Boolean(presetEditId)
  const canEditIndicator = indicatorEditModeNew || Boolean(selectedIndicatorId)

  const buildPineScript = (preset: Preset) => {
    const pj = JSON.stringify(preset.params || {})
    const sec = webhook?.secret || ""
    const secretDecl = `string sec = \"${sec}\"`
    const secretField = sec ? `,\\\"secret\\\":\\\"" + sec + "\\\"` : ``
    // Resolve indicator preference: explicit selection → preset.indicator key match → fallback
    // Preset seçiliyse onun indicator alanı önceliklidir; UI'de ayrıca seçilen indicator sadece görünümü etkiler
    const presetIndicator = indicators.find(d => d.key === preset.indicator) || null
    const effectiveIndicator = presetIndicator || selectedIndicator || null
    const indicatorKey = effectiveIndicator?.key || preset.indicator || 'utbot'
    const template = (effectiveIndicator?.pine_template || '').trim()
    const mergedParams = {
      ...(effectiveIndicator?.default_params || {}),
      ...(preset.params || {}),
    } as Record<string, unknown>

    const toPineLiteral = (value: unknown): string => {
      if (typeof value === 'number') return String(value)
      if (typeof value === 'boolean') return value ? 'true' : 'false'
      if (value === null || value === undefined) return 'na'
      // strings -> quoted
      return `"${String(value).replace(/"/g, '\\"')}"`
    }
    if (template && template.length > 0) {
      // Basit placeholder değişimleri: {{PRESET_ID}}, {{PRESET_VERSION}}, {{SECRET_LINE}}, {{SECRET_FIELD}}, {{INDICATOR_KEY}}
      let base = template
        .replaceAll('{{PRESET_ID}}', preset.name)
        .replaceAll('{{PRESET_VERSION}}', String(preset.version))
        .replaceAll('{{SECRET_LINE}}', secretDecl + "\n")
        .replaceAll('{{SECRET_FIELD}}', secretField)
        .replaceAll('{{INDICATOR_KEY}}', indicatorKey)
        .replaceAll('{{PARAM_JSON}}', JSON.stringify(mergedParams))

      // Dinamik parametre yerleştirme: {{PARAM:key}}
      // Anahtarların tamamını sırayla değiştiriyoruz
      Object.keys(mergedParams).forEach((k) => {
        const val = toPineLiteral(mergedParams[k])
        // replaceAll for both {{PARAM:key}} and {{PARAM_KEBAB}} convenience
        base = base.replaceAll(`{{PARAM:${k}}}`, val)
      })
      return base
    }
    // Built-in UT Bot fallback when no template is provided but UT Bot indicator selected
    if ((indicatorKey || '').toLowerCase() === 'utbot') {
      const atrLenLit = toPineLiteral((mergedParams as any)['atr'] ?? 10)
      const keyLit = toPineLiteral((mergedParams as any)['key'] ?? 1)
      const useHeikinLit = toPineLiteral((mergedParams as any)['h'] ?? (mergedParams as any)['useHeikin'] ?? false)
      return `//@version=5
indicator("AvoAlert - UT Bot Alerts", overlay=true)

// Preset: ${preset.name} v${preset.version}
// PresetId: ${preset.id}
// Params: ${pj}

// Preset ve Secret
string presetId = "${preset.name}"
int presetVersion = ${preset.version}
${secretDecl}
string indicatorKey = "${indicatorKey}"

// Orijinal UT Bot Alerts (v5'e uyarlanmış)
// Inputs -> preset paramlarından sabitlenir
a = ${keyLit}        // Key Value (sensitivity)
c = ${atrLenLit}     // ATR Period
h = ${useHeikinLit}  // Signals from Heikin Ashi Candles

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
   
xcolor = pos == -1 ? color.red: pos == 1 ? color.green : color.blue 

ema1   = ta.ema(src,1)
above = ta.crossover(ema1, xATRTrailingStop)
below = ta.crossover(xATRTrailingStop, ema1)

buy  = src > xATRTrailingStop and above 
sell = src < xATRTrailingStop and below

barbuy  = src > xATRTrailingStop 
barsell = src < xATRTrailingStop 

plotshape(buy,  title = "Buy",  text = 'Buy',  style = shape.labelup,   location = location.belowbar, color= color.new(color.green,0), textcolor = color.white, size = size.tiny)
plotshape(sell, title = "Sell", text = 'Sell', style = shape.labeldown, location = location.abovebar, color= color.new(color.red,0),   textcolor = color.white, size = size.tiny)

barcolor(barbuy  ? color.new(color.green,0) : na)
barcolor(barsell ? color.new(color.red,0)   : na)

// Hem klasik alertcondition hem de webhook için alert() mesajı
alertcondition(buy,  "UT Long",  "UT Long")
alertcondition(sell, "UT Short", "UT Short")

make_msg(action) =>
    ts   = str.tostring(time)
    sym  = syminfo.ticker
    tfp  = timeframe.period
    base = "{\\\"indicator\\\":\\\"" + indicatorKey + "\\\",\\\"symbol\\\":\\\"" + sym + "\\\",\\\"timeframe\\\":\\\"" + tfp + "\\\",\\\"action\\\":\\\"" + action + "\\\",\\\"presetId\\\":\\\"" + presetId + "\\\",\\\"presetVersion\\\":" + str.tostring(presetVersion) + ",\\\"ts\\\":\\\"" + ts + "\\\""
    sec != "" ? base + "${secretField}}" : base + "}"

if buy
    alert(make_msg("buy"), alert.freq_once_per_bar_close)

if sell
    alert(make_msg("sell"), alert.freq_once_per_bar_close)
`
    }
    return `//@version=5
 indicator("AvoAlert Multi", overlay=true)
 
 // Preset: ${preset.name} v${preset.version}
 // PresetId: ${preset.id}
 // Params: ${pj}
 
 // Preset ve Secret
 string presetId = "${preset.name}"
 int presetVersion = ${preset.version}
 ${secretDecl}
 string indicatorKey = "${indicatorKey}"
 // Basit sinyal: 10 SMA
 ma = ta.sma(close, 10)
 plot(ma, color=color.new(color.blue, 0), title="MA10")
 
 condBuy  = ta.crossover(close, ma)
 condSell = ta.crossunder(close, ma)
 
 // TradingView alertcondition sabit mesaj ister
 alertcondition(condBuy,  title="UTBOT BUY",  message="UTBOT BUY")
 alertcondition(condSell, title="UTBOT SELL", message="UTBOT SELL")
 
  make_msg(action) =>
     ts   = str.tostring(time)
     sym  = syminfo.ticker
     tfp  = timeframe.period
     base = "{\\\"indicator\\\":\\\"" + indicatorKey + "\\\",\\\"symbol\\\":\\\"" + sym + "\\\",\\\"timeframe\\\":\\\"" + tfp + "\\\",\\\"action\\\":\\\"" + action + "\\\",\\\"presetId\\\":\\\"" + presetId + "\\\",\\\"presetVersion\\\":" + str.tostring(presetVersion) + ",\\\"ts\\\":\\\"" + ts + "\\\""
     sec != "" ? base + "${secretField}}" : base + "}"
 
 // Tek alert: Condition = Any alert() function call, Message boş
 if condBuy
     alert(make_msg("buy"), alert.freq_once_per_bar_close)
 
 if condSell
     alert(make_msg("sell"), alert.freq_once_per_bar_close)
 `
  }

  const tasklist = useMemo(() => assigns.filter(a => a.status !== 'paused').map(a => ({ symbol: a.symbol, timeframe: a.timeframe, presetId: a.preset_id, presetVersion: a.preset_version })), [assigns])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <Badge variant="outline" className="px-3 py-1">Aktif alert: {tasklist.length}</Badge>
      </div>
      {/* Sekmeler: Presets, Indicators, Pine Script, Groups */}
      <div className="flex gap-2 text-sm">
        <button className={`px-3 py-1 border rounded ${activeTab==='presets'?'bg-gray-900 text-white':'hover:bg-gray-50'}`} onClick={()=> setActiveTab('presets')}>Presets</button>
        <button className={`px-3 py-1 border rounded ${activeTab==='indicators'?'bg-gray-900 text-white':'hover:bg-gray-50'}`} onClick={()=> setActiveTab('indicators')}>Indicators</button>
        <button className={`px-3 py-1 border rounded ${activeTab==='script'?'bg-gray-900 text-white':'hover:bg-gray-50'}`} onClick={()=> setActiveTab('script' as any)}>Pine Script</button>
        <button className={`px-3 py-1 border rounded ${activeTab==='groups'?'bg-gray-900 text-white':'hover:bg-gray-50'}`} onClick={()=> setActiveTab('groups' as any)}>Groups</button>
      </div>

      {/* Presets sekmesi */}
      {activeTab === 'presets' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Presets</CardTitle>
            <CardDescription>Parametre setleri ve versiyonlar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
          {/* Preset seçimi (düzenleme için yükle) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm items-end">
            <div className="col-span-2">
              <label className="text-xs text-gray-600">Mevcut Preset Seç</label>
              <select className="w-full border rounded px-2 py-1" value={presetEditId} onChange={e => {
                const id = e.target.value
                setPresetEditId(id)
                const p = presets.find(pp => pp.id === id)
                if (p) {
                  setNewPreset({ name: p.name, version: p.version, paramsText: JSON.stringify(p.params || {}), active: p.active })
                  const rows = Object.entries(p.params || {}).map(([k,v])=> ({ k, t: (typeof v === 'boolean' ? 'boolean' : (typeof v === 'number' ? 'number' : 'string')) as ParamType, v: String(v) }))
                  setPresetParamRows(rows)
                  const iid = indicators.find(d => d.key === p.indicator)?.id || ''
                  setNewPresetIndicatorId(iid)
                  setPresetEditModeNew(false)
                }
              }}>
                <option value="">Lütfen Seçin</option>
                {presets.map(p => <option key={p.id} value={p.id}>{p.name} v{p.version}</option>)}
              </select>
            </div>
            <div className="col-span-1 flex items-end justify-between text-xs text-gray-600">
              <Badge variant="secondary">{presets.length}</Badge>
              <Button variant="outline" size="sm" onClick={()=>{ setPresetEditModeNew(true); setPresetEditId(''); setNewPreset({ name:'', version:1, paramsText:'', active:true }); setPresetParamRows([]); setNewPresetIndicatorId('') }}>Yeni</Button>
            </div>
          </div>
          <div>
            <h3 className="font-medium text-sm mb-2">Preset Oluştur / Güncelle</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <input className="border rounded px-2 py-1" placeholder="Name (örn. UTB_A)" value={newPreset.name} onChange={e=>setNewPreset({...newPreset,name:e.target.value})} disabled={!canEditPreset} />
              <input className="border rounded px-2 py-1" type="number" placeholder="Version" value={newPreset.version} onChange={e=>setNewPreset({...newPreset,version: Number(e.target.value)||1})} disabled={!canEditPreset} />
              <div className="col-span-2 grid grid-cols-2 gap-2 items-end">
                <div>
                  <label className="text-xs text-gray-600">Indicator</label>
                  <select className="w-full border rounded px-2 py-1" disabled={!canEditPreset} value={newPresetIndicatorId} onChange={e=> {
                    const id = e.target.value
                    setNewPresetIndicatorId(id)
                    const ind = indicators.find(d=> d.id === id)
                    // load indicator default params into preset rows
                    const rows = Object.entries(ind?.default_params || {}).map(([k,v])=> ({ k, t: (typeof v === 'boolean' ? 'boolean' : 'number') as ParamType, v: String(v) }))
                    setPresetParamRows(rows)
                  }}>
                    <option value="">Lütfen Seçin</option>
                    {indicators.map(d => <option key={d.id} value={d.id}>{d.name} ({d.key})</option>)}
                  </select>
                </div>
                <div className="text-xs text-gray-500 text-right">Coin seçimi gerekmez; TradingView grafiğinde hangi sembol ve timeframe açıksa o kullanılır.</div>
              </div>
              {/* Preset Params (indicator'a göre) */}
              <div className="col-span-2">
                <div className="mb-2 text-xs text-gray-600">Params (indicator’a göre)</div>
                <div className="space-y-2">
                  {presetParamRows.map((p,idx)=> (
                    <div key={idx} className="grid grid-cols-3 gap-2">
                      <input className="border rounded px-2 py-1 bg-gray-100 text-gray-600" placeholder="name" value={p.k} disabled title="Param anahtarı indikatörden gelir." />
                      <select className="border rounded px-2 py-1 bg-gray-100 text-gray-600" value={p.t} onChange={()=>{}} disabled title="Parametre tipi indikatörden gelir. Değiştirmek için Indicators kartını kullanın.">
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                      </select>
                      {p.t === 'boolean' ? (
                        <select className="border rounded px-2 py-1" value={p.v} onChange={e=>{ const arr=[...presetParamRows]; arr[idx]={...arr[idx],v:e.target.value}; setPresetParamRows(arr) }}>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input className="border rounded px-2 py-1" placeholder="value" value={p.v} onChange={e=>{ const arr=[...presetParamRows]; arr[idx]={...arr[idx],v:e.target.value}; setPresetParamRows(arr) }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button className="col-span-2" disabled={loading || !canEditPreset}
                onClick={async ()=>{
                  try{
                    setLoading(true)
                    const params = presetParamRows.reduce((acc:any, cur)=>{ if(!cur.k) return acc; acc[cur.k] = cur.t==='boolean' ? (cur.v==='true') : (cur.t==='number' ? Number(cur.v) : cur.v); return acc }, {} as any)
                    let resp: Response
                    const indKey = (newPresetIndicatorId ? (indicators.find(d=> d.id === newPresetIndicatorId)?.key || '') : (presetEdit?.indicator || '')) || 'utbot'
                    if (!newPreset.name.trim()) { alert('İsim gerekli'); setLoading(false); return }
                    if (!presetEditModeNew && presetEditId) {
                      // Güncelle
                      resp = await fetch(`${API_BASE}/admin/presets/${presetEditId}`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({name:newPreset.name,indicator:indKey,version:newPreset.version,params,active:newPreset.active})})
                    } else {
                      // Yeni ekle (indicator: utbot default)
                      resp = await fetch(`${API_BASE}/admin/presets`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:newPreset.name,indicator:indKey,version:newPreset.version,params,active:newPreset.active})})
                    }
                    const j = await resp.json().catch(()=>({}))
                    if (!resp.ok) { alert('Preset kaydedilemedi: ' + ((j as any)?.error || 'bilinmeyen hata')); setLoading(false); return }
                    await loadAll()
                    if (presetEditModeNew && (j as any)?.id) {
                      setPresetEditId((j as any).id)
                      setPresetEditModeNew(false)
                    }
                  }catch(err){ alert('Preset kaydedilemedi: '+(err as any)?.message) } finally{ setLoading(false) }
                }}>{presetEditModeNew ? 'Yeni Preset Kaydet' : 'Preset Güncelle'}</Button>
            </div>
          </div>
          </CardContent>
        </Card>
        {/* Preset listesi */}
        <Card>
          <CardHeader>
            <CardTitle>Preset Listesi</CardTitle>
            <CardDescription>Mevcut preset kayıtları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-600 mb-2">Toplam: {presets.length}</div>
            <div className="text-xs bg-gray-50 p-3 rounded max-h-72 overflow-auto">
              <ul className="space-y-1">
                {presets.map((p)=> (
                  <li key={p.id} className="flex justify-between gap-2">
                    <span className="font-mono">{p.name}</span>
                    <span className="text-gray-600">v{p.version}</span>
                    <span className="text-gray-500">{p.indicator}</span>
                  </li>
                ))}
                {presets.length===0 && <li className="text-gray-500">Kayıt yok.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Pine Script sekmesi */}
      {activeTab === 'script' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pine Script Oluşturma</CardTitle>
            <CardDescription>Preset seç → script üret (indikator, preset’ten çözülür)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm items-end">
              <div className="col-span-2">
                <label className="text-xs text-gray-600">Preset</label>
                <select className="w-full border rounded px-2 py-1" value={presetScriptId} onChange={e => setPresetScriptId(e.target.value)}>
                  <option value="">Lütfen Seçin</option>
                  {presets.map(p => <option key={p.id} value={p.id}>{p.name} v{p.version}</option>)}
                </select>
                {selectedPreset && (
                  <div className="mt-1 text-xs text-gray-500">Bağlı indikatör: {(indicators.find(d=> d.key === selectedPreset.indicator)?.name) || selectedPreset.indicator}</div>
                )}
              </div>
              <div className="col-span-1 flex items-end md:pt-6">
                <Button className="w-full h-10" disabled={!selectedPreset}
                  onClick={()=>{
                    if(!selectedPreset){ alert('Önce bir preset seç'); return }
                    const s = buildPineScript(selectedPreset)
                    setGeneratedScript(s)
                  }}>Pine Script Üret</Button>
              </div>
            </div>
            <div className="text-xs text-gray-500">Not: Coin seçimi gerekmez. Script, TradingView’da açık olan sembol ve timeframe ile çalışır.</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kopyala</CardTitle>
            <CardDescription>TradingView Pine Editor’a yapıştır</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 text-sm">
              <Button variant="outline" onClick={async()=>{
                if(!generatedScript){ alert('Preset seçip \"Pine Script Üret\"e tıkla'); return }
                try{ await navigator.clipboard.writeText(generatedScript); alert('Script kopyalandı') } catch{ alert('Kopyalanamadı') }
              }}>Kopyala</Button>
              <Button variant="outline" onClick={()=> setGeneratedScript('') }>Temizle</Button>
            </div>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-72">{generatedScript || '// Preset seç ve "Pine Script Üret" butonuna tıkla'}</pre>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Groups sekmesi */}
      {activeTab === 'groups' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Coin Grupları</CardTitle>
            <CardDescription>Birlikte yönetmek için sembol kümeleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-gray-600">Toplam grup: {groups.length}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <input className="border rounded px-2 py-1" placeholder="Group Name" value={newGroup.name} onChange={e=>setNewGroup({...newGroup,name:e.target.value})} />
              <input className="border rounded px-2 py-1" placeholder="Symbols (CSV)" value={newGroup.symbolsText} onChange={e=>setNewGroup({...newGroup,symbolsText:e.target.value})} />
              <Button className="col-span-2" disabled={loading}
                onClick={async ()=>{
                  try{
                    setLoading(true)
                    const symbols = newGroup.symbolsText.split(/[\s,]+/).filter(Boolean)
                    await fetch(`${API_BASE}/admin/groups`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:newGroup.name,symbols})})
                    await loadAll()
                  }catch(err){ alert('Grup kaydedilemedi') } finally{ setLoading(false) }
                }}>Grup Kaydet</Button>
            </div>
            <div className="mt-3 text-xs bg-gray-50 p-3 rounded max-h-64 overflow-auto">
              <ul className="space-y-1">
                {groups.map(g => (
                  <li key={g.id} className="">
                    <button className="w-full flex justify-between gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                      onClick={()=> setExpandedGroupId(expandedGroupId===g.id?null:g.id)}>
                      <span className="font-mono text-left">{g.name}</span>
                      <span className="text-gray-600">{(g.symbols || []).length} symbol</span>
                    </button>
                    {expandedGroupId===g.id && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(g.symbols||[]).map((s,idx)=> (
                          <span key={idx} className="px-1.5 py-0.5 bg-white border rounded">{s}</span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
                {groups.length===0 && <li className="text-gray-500">Kayıt yok.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Timeframe Setleri</CardTitle>
            <CardDescription>Önceden tanımlı TF listeleri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-gray-600">Toplam set: {tfs.length}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <input className="border rounded px-2 py-1" placeholder="Set Name" value={newTF.name} onChange={e=>setNewTF({...newTF,name:e.target.value})} />
              <input className="border rounded px-2 py-1" placeholder="TFs (CSV) örn: 15m,1h,4h" value={newTF.timeframesText} onChange={e=>setNewTF({...newTF,timeframesText:e.target.value})} />
              <Button className="col-span-2" disabled={loading}
                onClick={async ()=>{
                  try{
                    setLoading(true)
                    const timeframes = newTF.timeframesText.split(/[\s,]+/).filter(Boolean)
                    await fetch(`${API_BASE}/admin/timeframes`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:newTF.name,timeframes})})
                    await loadAll()
                  }catch(err){ alert('Timeframe set kaydedilemedi') } finally{ setLoading(false) }
                }}>Set Kaydet</Button>
            </div>
            <div className="mt-3 text-xs bg-gray-50 p-3 rounded max-h-64 overflow-auto">
              <ul className="space-y-1">
                {tfs.map(t => (
                  <li key={t.id} className="">
                    <button className="w-full flex justify-between gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                      onClick={()=> setExpandedTFSetId(expandedTFSetId===t.id?null:t.id)}>
                      <span className="font-mono text-left">{t.name}</span>
                      <span className="text-gray-600">{(t.timeframes || []).length} TF</span>
                    </button>
                    {expandedTFSetId===t.id && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(t.timeframes||[]).map((tf,idx)=> (
                          <span key={idx} className="px-1.5 py-0.5 bg-white border rounded">{tf}</span>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
                {tfs.length===0 && <li className="text-gray-500">Kayıt yok.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
      {/* Indicators sekmesi */}
      {activeTab === 'indicators' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Indicators</CardTitle>
            <CardDescription>İndikatör tanımı ve Pine şablonu</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm items-end">
              <div className="col-span-2">
                <label className="text-xs text-gray-600">Mevcut Indicator Seç</label>
                <select className="w-full border rounded px-2 py-1" value={selectedIndicatorId} onChange={e=>{
                  const id = e.target.value
                  setSelectedIndicatorId(id)
                  setIndicatorEditModeNew(false)
                  const ind = indicators.find(x=> x.id === id)
                  if (ind){
                    const paramsArr = Object.entries(ind.default_params || {}).map(([k,v])=> ({ k, t: (typeof v === 'boolean' ? 'boolean' : 'number') as ParamType, v: String(v) }))
                    setNewIndicator({ name: ind.name, key: ind.key, template: ind.pine_template || '', params: paramsArr })
                  }
                }}>
                  <option value="">Lütfen Seçin</option>
                  {indicators.map(d => <option key={d.id} value={d.id}>{d.name} ({d.key})</option>)}
                </select>
              </div>
              <div className="col-span-1 flex items-end justify-between text-xs text-gray-600">
                <Badge variant="secondary">{indicators.length}</Badge>
                <Button variant="outline" size="sm" onClick={()=>{ setIndicatorEditModeNew(true); setNewIndicator({ name:'', key:'', template:'', params:[{k:'',t:'number',v:''}] }) }}>Yeni</Button>
              </div>
            </div>
            <div className="mt-3 border-t pt-3 grid grid-cols-2 gap-2 text-sm">
              <input className="border rounded px-2 py-1" placeholder="Name (örn. UT Bot)" value={newIndicator.name} onChange={e=>setNewIndicator({...newIndicator,name:e.target.value})} disabled={!canEditIndicator} />
              <input className="border rounded px-2 py-1" placeholder="Key (örn. utbot)" value={newIndicator.key} onChange={e=>setNewIndicator({...newIndicator,key:e.target.value})} disabled={!canEditIndicator} />
              <textarea className="col-span-2 border rounded px-2 py-1 h-24" placeholder="Pine template (opsiyonel). {{PRESET_ID}}, {{PRESET_VERSION}}, {{SECRET_LINE}}, {{SECRET_FIELD}}, {{INDICATOR_KEY}} placeholder destekler." value={newIndicator.template} onChange={e=>setNewIndicator({...newIndicator,template:e.target.value})} disabled={!canEditIndicator} />
              {/* Default Params */}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-600">Default Params (opsiyonel)</span>
                  <Button variant="outline" size="sm" onClick={()=> setNewIndicator({...newIndicator, params:[...newIndicator.params, {k:'',t:'number',v:''}]})} disabled={!canEditIndicator || !indicatorEditModeNew && !selectedIndicatorId}>+</Button>
                </div>
                <div className="space-y-2">
                  {newIndicator.params.map((p,idx)=> (
                    <div key={idx} className="grid grid-cols-5 gap-2">
                      <input className="border rounded px-2 py-1" placeholder="name" value={p.k} onChange={e=>{ const arr=[...newIndicator.params]; arr[idx]={...arr[idx],k:e.target.value}; setNewIndicator({...newIndicator, params:arr}) }} disabled={!canEditIndicator} />
                      <select className="border rounded px-2 py-1" value={p.t} onChange={e=>{ const arr=[...newIndicator.params]; arr[idx]={...arr[idx],t:e.target.value as ParamType}; setNewIndicator({...newIndicator, params:arr}) }} disabled={!canEditIndicator}>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                      </select>
                      {p.t==='boolean' ? (
                        <select className="border rounded px-2 py-1" value={p.v} onChange={e=>{ const arr=[...newIndicator.params]; arr[idx]={...arr[idx],v:e.target.value}; setNewIndicator({...newIndicator, params:arr}) }} disabled={!canEditIndicator}>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input className="border rounded px-2 py-1" placeholder="value" value={p.v} onChange={e=>{ const arr=[...newIndicator.params]; arr[idx]={...arr[idx],v:e.target.value}; setNewIndicator({...newIndicator, params:arr}) }} disabled={!canEditIndicator} />
                      )}
                      <Button variant="outline" size="sm" onClick={()=>{ const arr=newIndicator.params.filter((_,i)=>i!==idx); setNewIndicator({...newIndicator, params:arr}) }} disabled={!canEditIndicator}>Sil</Button>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="col-span-2" disabled={loading || !canEditIndicator}
                onClick={async ()=>{
                  if(!newIndicator.name || !newIndicator.key){ alert('Name ve Key gerekli'); return }
                  const default_params = newIndicator.params.reduce((acc:any, cur)=>{ if(!cur.k) return acc; acc[cur.k] = cur.t==='boolean' ? (cur.v==='true') : (cur.t==='number' ? Number(cur.v) : cur.v); return acc }, {} as any)
                  try{
                    setLoading(true)
                    if (indicatorEditModeNew || !selectedIndicatorId){
                      await fetch(`${API_BASE}/admin/indicators`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:newIndicator.name,key:newIndicator.key,pine_template:newIndicator.template,default_params,active:true})})
                    } else {
                      await fetch(`${API_BASE}/admin/indicators/${selectedIndicatorId}`,{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({name:newIndicator.name,key:newIndicator.key,pine_template:newIndicator.template,default_params,active:true})})
                    }
                    await loadAll()
                  }catch(err){ alert('Indicator kaydedilemedi') } finally{ setLoading(false) }
                }}>{indicatorEditModeNew ? 'Yeni Indicator Kaydet' : 'Indicator Güncelle'}</Button>
            </div>
          </CardContent>
        </Card>
        {/* Indicator listesi */}
        <Card>
          <CardHeader>
            <CardTitle>Indicator Listesi</CardTitle>
            <CardDescription>Mevcut indicator kayıtları</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-gray-600 mb-2">Toplam: {indicators.length}</div>
            <div className="text-xs bg-gray-50 p-3 rounded max-h-72 overflow-auto">
              <ul className="space-y-1">
                {indicators.map((d)=> (
                  <li key={d.id} className="flex justify-between gap-2">
                    <span className="font-mono">{d.name}</span>
                    <span className="text-gray-600">({d.key})</span>
                  </li>
                ))}
                {indicators.length===0 && <li className="text-gray-500">Kayıt yok.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  )
}


