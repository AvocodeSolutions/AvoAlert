"use client"
import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Settings, Code, Users, Target, TrendingUp, Activity, Plus, Edit3, Copy, Trash2, ChevronDown, ChevronRight } from 'lucide-react'

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
    const [p, g, t, a, i, c, tfm] = await Promise.all([
      fetch(`${API_BASE}/admin/presets`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/groups`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/timeframes`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/assignments`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/indicators`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/coins`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/tf-master`).then(r => r.json()).catch(() => ({ items: [] })),
    ])
    setPresets(p.items || [])
    setGroups(g.items || [])
    setTfs(t.items || [])
    setAssigns(a.items || [])
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
    const sec = process.env.TRADINGVIEW_WEBHOOK_SECRET || ""
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Panel</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Trading Alert Yönetimi</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-2 bg-green-50 border-green-200 text-green-700 dark:bg-green-950 dark:border-green-800 dark:text-green-400">
                <Activity className="h-4 w-4 mr-2" />
                Aktif Alert: {tasklist.length}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Presets</p>
                  <p className="text-3xl font-bold">{presets.length}</p>
                </div>
                <Target className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Indicators</p>
                  <p className="text-3xl font-bold">{indicators.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Groups</p>
                  <p className="text-3xl font-bold">{groups.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Scripts</p>
                  <p className="text-3xl font-bold">{generatedScript ? '1' : '0'}</p>
                </div>
                <Code className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Tab Navigation */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 p-1">
          <div className="flex gap-1">
            {[
              { key: 'presets', label: 'Presets', icon: Target },
              { key: 'indicators', label: 'Indicators', icon: TrendingUp },
              { key: 'script', label: 'Pine Script', icon: Code },
              { key: 'groups', label: 'Groups', icon: Users }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                  activeTab === key
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                onClick={() => setActiveTab(key as any)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Presets sekmesi */}
        {activeTab === 'presets' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-b border-slate-200/50 dark:border-slate-700/50 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Preset Management</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">Parametre setleri ve versiyonlar</CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent className="p-6 space-y-6">
          {/* Preset seçimi (düzenleme için yükle) */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Preset Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="col-span-2">
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Mevcut Preset Seç</label>
                <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={presetEditId} onChange={e => {
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
              <div className="col-span-1 flex items-end justify-between">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">{presets.length}</Badge>
                <Button variant="outline" size="sm" className="border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950" onClick={()=>{ setPresetEditModeNew(true); setPresetEditId(''); setNewPreset({ name:'', version:1, paramsText:'', active:true }); setPresetParamRows([]); setNewPresetIndicatorId('') }}>+ Yeni</Button>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Preset Oluştur / Güncelle
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="Name (örn. UTB_A)" value={newPreset.name} onChange={e=>setNewPreset({...newPreset,name:e.target.value})} disabled={!canEditPreset} />
              <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" type="number" placeholder="Version" value={newPreset.version} onChange={e=>setNewPreset({...newPreset,version: Number(e.target.value)||1})} disabled={!canEditPreset} />
              <div className="col-span-2 grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Indicator</label>
                  <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" disabled={!canEditPreset} value={newPresetIndicatorId} onChange={e=> {
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
                <div className="text-xs text-slate-500 dark:text-slate-400 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">💡 Coin seçimi gerekmez; TradingView grafiğinde hangi sembol ve timeframe açıksa o kullanılır.</div>
              </div>
              {/* Preset Params (indicator'a göre) */}
              <div className="col-span-2">
                <div className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Params (indicator&apos;a göre)
                </div>
                <div className="space-y-3">
                  {presetParamRows.map((p,idx)=> (
                    <div key={idx} className="grid grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                      <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" placeholder="name" value={p.k} disabled title="Param anahtarı indikatörden gelir." />
                      <select className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" value={p.t} onChange={()=>{}} disabled title="Parametre tipi indikatörden gelir. Değiştirmek için Indicators kartını kullanın.">
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                      </select>
                      {p.t === 'boolean' ? (
                        <select className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" value={p.v} onChange={e=>{ const arr=[...presetParamRows]; arr[idx]={...arr[idx],v:e.target.value}; setPresetParamRows(arr) }}>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="value" value={p.v} onChange={e=>{ const arr=[...presetParamRows]; arr[idx]={...arr[idx],v:e.target.value}; setPresetParamRows(arr) }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <Button className="col-span-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200" disabled={loading || !canEditPreset}
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
          <Card className="shadow-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 border-b border-slate-200/50 dark:border-slate-700/50 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Preset Directory</CardTitle>
                  <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">Mevcut preset kayıtları</CardDescription>
                </div>
              </div>
            </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Toplam Presets</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">{presets.length}</Badge>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 max-h-80 overflow-auto">
              <ul className="space-y-2">
                {presets.map((p)=> (
                  <li key={p.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="font-mono text-slate-900 dark:text-white font-medium">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">v{p.version}</Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{p.indicator}</span>
                    </div>
                  </li>
                ))}
                {presets.length===0 && <li className="text-slate-500 dark:text-slate-400 text-center py-8">Kayıt yok.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Pine Script sekmesi */}
      {activeTab === 'script' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50 border-b border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Pine Script Generator</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">Preset seç → script üret (indikator, preset&apos;ten çözülür)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Script Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Preset</label>
                  <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" value={presetScriptId} onChange={e => setPresetScriptId(e.target.value)}>
                  <option value="">Lütfen Seçin</option>
                  {presets.map(p => <option key={p.id} value={p.id}>{p.name} v{p.version}</option>)}
                </select>
                {selectedPreset && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <span className="text-xs text-blue-700 dark:text-blue-300">Bağlı indikatör: {(indicators.find(d=> d.key === selectedPreset.indicator)?.name) || selectedPreset.indicator}</span>
                  </div>
                )}
                </div>
                <div className="col-span-1 flex items-end">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200" disabled={!selectedPreset}
                  onClick={()=>{
                    if(!selectedPreset){ alert('Önce bir preset seç'); return }
                    const s = buildPineScript(selectedPreset)
                    setGeneratedScript(s)
                  }}>🚀 Script Üret</Button>
                </div>
              </div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-xs text-amber-700 dark:text-amber-300">💡 Not: Coin seçimi gerekmez. Script, TradingView&apos;da açık olan sembol ve timeframe ile çalışır.</span>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 border-b border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                <Copy className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Script Output</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">TradingView Pine Editor&apos;a yapıştır</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex gap-3">
              <Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950" onClick={async()=>{
                if(!generatedScript){ alert('Preset seçip \"Pine Script Üret\"e tıkla'); return }
                try{ await navigator.clipboard.writeText(generatedScript); alert('Script kopyalandı') } catch{ alert('Kopyalanamadı') }
              }}>📋 Kopyala</Button>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950" onClick={()=> setGeneratedScript('') }>🗑️ Temizle</Button>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <pre className="text-xs p-4 overflow-auto max-h-80 font-mono text-slate-700 dark:text-slate-300">{generatedScript || '// Preset seç ve "Pine Script Üret" butonuna tıkla'}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Groups sekmesi */}
      {activeTab === 'groups' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 border-b border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Coin Groups</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">Birlikte yönetmek için sembol kümeleri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Toplam Gruplar</span>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">{groups.length}</Badge>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Yeni Grup Oluştur
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" placeholder="Group Name" value={newGroup.name} onChange={e=>setNewGroup({...newGroup,name:e.target.value})} />
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all" placeholder="Symbols (CSV)" value={newGroup.symbolsText} onChange={e=>setNewGroup({...newGroup,symbolsText:e.target.value})} />
                <Button className="col-span-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200" disabled={loading}
                onClick={async ()=>{
                  try{
                    setLoading(true)
                    const symbols = newGroup.symbolsText.split(/[\s,]+/).filter(Boolean)
                    await fetch(`${API_BASE}/admin/groups`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:newGroup.name,symbols})})
                    await loadAll()
                  }catch(err){ alert('Grup kaydedilemedi') } finally{ setLoading(false) }
                }}>💾 Grup Kaydet</Button>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 max-h-80 overflow-auto">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Mevcut Gruplar</h4>
              <ul className="space-y-2">
                {groups.map(g => (
                  <li key={g.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200"
                      onClick={()=> setExpandedGroupId(expandedGroupId===g.id?null:g.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        <span className="font-mono text-slate-900 dark:text-white font-medium">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{(g.symbols || []).length} symbols</Badge>
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expandedGroupId===g.id ? 'rotate-90' : ''}`} />
                      </div>
                    </button>
                    {expandedGroupId===g.id && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex flex-wrap gap-2">
                          {(g.symbols||[]).map((s,idx)=> (
                            <span key={idx} className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs rounded-md border border-emerald-200 dark:border-emerald-800">{s}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
                {groups.length===0 && <li className="text-slate-500 dark:text-slate-400 text-center py-8">Kayıt yok.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/50 dark:to-blue-950/50 border-b border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Timeframe Sets</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">Önceden tanımlı TF listeleri</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Toplam Sets</span>
              <Badge variant="secondary" className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300">{tfs.length}</Badge>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                Yeni Set Oluştur
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" placeholder="Set Name" value={newTF.name} onChange={e=>setNewTF({...newTF,name:e.target.value})} />
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" placeholder="TFs (CSV) örn: 15m,1h,4h" value={newTF.timeframesText} onChange={e=>setNewTF({...newTF,timeframesText:e.target.value})} />
                <Button className="col-span-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200" disabled={loading}
                onClick={async ()=>{
                  try{
                    setLoading(true)
                    const timeframes = newTF.timeframesText.split(/[\s,]+/).filter(Boolean)
                    await fetch(`${API_BASE}/admin/timeframes`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:newTF.name,timeframes})})
                    await loadAll()
                  }catch(err){ alert('Timeframe set kaydedilemedi') } finally{ setLoading(false) }
                }}>⏰ Set Kaydet</Button>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700 max-h-80 overflow-auto">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Mevcut Sets</h4>
              <ul className="space-y-2">
                {tfs.map(t => (
                  <li key={t.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                    <button className="w-full flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200"
                      onClick={()=> setExpandedTFSetId(expandedTFSetId===t.id?null:t.id)}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                        <span className="font-mono text-slate-900 dark:text-white font-medium">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{(t.timeframes || []).length} TFs</Badge>
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expandedTFSetId===t.id ? 'rotate-90' : ''}`} />
                      </div>
                    </button>
                    {expandedTFSetId===t.id && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-600">
                        <div className="flex flex-wrap gap-2">
                          {(t.timeframes||[]).map((tf,idx)=> (
                            <span key={idx} className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-xs rounded-md border border-cyan-200 dark:border-cyan-800">{tf}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
                {tfs.length===0 && <li className="text-slate-500 dark:text-slate-400 text-center py-8">Kayıt yok.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
      {/* Indicators sekmesi */}
      {activeTab === 'indicators' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 border-b border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Indicator Management</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">İndikatör tanımı ve Pine şablonu</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                Indicator Selection
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">Mevcut Indicator Seç</label>
                  <select className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" value={selectedIndicatorId} onChange={e=>{
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
                <div className="col-span-1 flex items-end justify-between">
                  <Badge variant="secondary" className="bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300">{indicators.length}</Badge>
                  <Button variant="outline" size="sm" className="border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950" onClick={()=>{ setIndicatorEditModeNew(true); setNewIndicator({ name:'', key:'', template:'', params:[{k:'',t:'number',v:''}] }) }}>+ Yeni</Button>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Indicator Oluştur / Güncelle
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" placeholder="Name (örn. UT Bot)" value={newIndicator.name} onChange={e=>setNewIndicator({...newIndicator,name:e.target.value})} disabled={!canEditIndicator} />
                <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" placeholder="Key (örn. utbot)" value={newIndicator.key} onChange={e=>setNewIndicator({...newIndicator,key:e.target.value})} disabled={!canEditIndicator} />
                <textarea className="col-span-2 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all h-24 resize-none" placeholder="Pine template (opsiyonel). {{PRESET_ID}}, {{PRESET_VERSION}}, {{SECRET_LINE}}, {{SECRET_FIELD}}, {{INDICATOR_KEY}} placeholder destekler." value={newIndicator.template} onChange={e=>setNewIndicator({...newIndicator,template:e.target.value})} disabled={!canEditIndicator} />
                {/* Default Params */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      Default Params (opsiyonel)
                    </span>
                    <Button variant="outline" size="sm" className="border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-950" onClick={()=> setNewIndicator({...newIndicator, params:[...newIndicator.params, {k:'',t:'number',v:''}]})} disabled={!canEditIndicator || !indicatorEditModeNew && !selectedIndicatorId}>+ Param</Button>
                  </div>
                  <div className="space-y-3">
                    {newIndicator.params.map((p,idx)=> (
                      <div key={idx} className="grid grid-cols-5 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                        <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" placeholder="name" value={p.k} onChange={e=>{ const arr=[...newIndicator.params]; arr[idx]={...arr[idx],k:e.target.value}; setNewIndicator({...newIndicator, params:arr}) }} disabled={!canEditIndicator} />
                        <select className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" value={p.t} onChange={e=>{ const arr=[...newIndicator.params]; arr[idx]={...arr[idx],t:e.target.value as ParamType}; setNewIndicator({...newIndicator, params:arr}) }} disabled={!canEditIndicator}>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                      </select>
                        {p.t==='boolean' ? (
                          <select className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" value={p.v} onChange={e=>{ const arr=[...newIndicator.params]; arr[idx]={...arr[idx],v:e.target.value}; setNewIndicator({...newIndicator, params:arr}) }} disabled={!canEditIndicator}>
                            <option value="true">true</option>
                            <option value="false">false</option>
                          </select>
                        ) : (
                          <input className="border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all" placeholder="value" value={p.v} onChange={e=>{ const arr=[...newIndicator.params]; arr[idx]={...arr[idx],v:e.target.value}; setNewIndicator({...newIndicator, params:arr}) }} disabled={!canEditIndicator} />
                        )}
                        <Button variant="outline" size="sm" className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950" onClick={()=>{ const arr=newIndicator.params.filter((_,i)=>i!==idx); setNewIndicator({...newIndicator, params:arr}) }} disabled={!canEditIndicator}>🗑️</Button>
                    </div>
                  ))}
                </div>
              </div>
                <Button className="col-span-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200" disabled={loading || !canEditIndicator}
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
                }}>{indicatorEditModeNew ? '✨ Yeni Indicator Kaydet' : '📝 Indicator Güncelle'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Indicator listesi */}
        <Card className="shadow-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 border-b border-slate-200/50 dark:border-slate-700/50 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl shadow-lg">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-semibold text-slate-900 dark:text-white">Indicator Directory</CardTitle>
                <CardDescription className="text-slate-600 dark:text-slate-400 mt-1">Mevcut indicator kayıtları</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Toplam Indicators</span>
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">{indicators.length}</Badge>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 max-h-80 overflow-auto">
              <ul className="space-y-2">
                {indicators.map((d)=> (
                  <li key={d.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      <span className="font-mono text-slate-900 dark:text-white font-medium">{d.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">({d.key})</Badge>
                  </li>
                ))}
                {indicators.length===0 && <li className="text-slate-500 dark:text-slate-400 text-center py-8">Kayıt yok.</li>}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
      )}
      </div>
    </div>
  )
}


