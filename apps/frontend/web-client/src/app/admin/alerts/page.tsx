"use client"
import { useEffect, useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'

type Preset = { id: string; name: string; indicator: string; version: number; params: any; active: boolean }
type Group = { id: string; name: string; symbols: string[] }
type TFSet = { id: string; name: string; timeframes: string[] }
type Assign = { id: string; symbol: string; timeframe: string; preset_id: string; preset_version: number; status: string }

export default function AlertsPanel() {
  const [presets, setPresets] = useState<Preset[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [tfs, setTfs] = useState<TFSet[]>([])
  const [assigns, setAssigns] = useState<Assign[]>([])
  const [webhook, setWebhook] = useState<{ url: string; secret: string } | null>(null)
  const [selectedPresetId, setSelectedPresetId] = useState<string>("")
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

  const loadAll = async () => {
    const [p, g, t, a, w] = await Promise.all([
      fetch(`${API_BASE}/admin/presets`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/groups`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/timeframes`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/assignments`).then(r => r.json()).catch(() => ({ items: [] })),
      fetch(`${API_BASE}/admin/webhook`).then(r => r.json()).catch(() => ({ url: '', secret: '' })),
    ])
    setPresets(p.items || [])
    setGroups(g.items || [])
    setTfs(t.items || [])
    setAssigns(a.items || [])
    setWebhook({ url: w.url || '', secret: w.secret || '' })
    if (!selectedPresetId && (p.items || []).length > 0) setSelectedPresetId(p.items[0].id)
  }

  useEffect(() => { loadAll() }, [])

  const selectedPreset = useMemo(() => presets.find(p => p.id === selectedPresetId) || null, [presets, selectedPresetId])

  const buildPineScript = (preset: Preset) => {
    const pj = JSON.stringify(preset.params || {})
    const sec = webhook?.secret || ""
    const secretLine = sec ? `sec = \"${sec}\"  // panel secret\n` : `// sec = \"YOUR_SECRET\"  // panelden al ve doldur\n`
    const secretField = sec ? `,\\\"secret\\\":\\\"" + sec + "\\\"` : ``
    return `//@version=5
indicator("AvoAlert Multi", overlay=true)

// Preset: ${preset.name} v${preset.version}
// PresetId: ${preset.id}
// Params: ${pj}

// Preset ve Secret
presetId = "${preset.name}"
presetVersion = ${preset.version}
${secretLine}
// Basit sinyal: 10 SMA
ma = ta.sma(close, 10)
plot(ma, color=color.new(color.blue, 0), title="MA10")

condBuy  = ta.crossover(close, ma)
condSell = ta.crossunder(close, ma)

// TradingView alertcondition sabit mesaj ister
alertcondition(condBuy,  title="UTBOT BUY",  message="UTBOT BUY")
alertcondition(condSell, title="UTBOT SELL", message="UTBOT SELL")

// Tek alert: Condition = Any alert() function call, Message boş
if condBuy
    ts  = str.tostring(time)
    msg = "{\\\"indicator\\\":\\\"utbot\\\",\\\"action\\\":\\\"buy\\\",\\\"presetId\\\":\\\"" + presetId + "\\\",\\\"presetVersion\\\":" + str.tostring(presetVersion) + ",\\\"ts\\\":\\\"" + ts + "\\\"${secretField}}"
    alert(msg, alert.freq_once_per_bar_close)

if condSell
    ts  = str.tostring(time)
    msg = "{\\\"indicator\\\":\\\"utbot\\\",\\\"action\\\":\\\"sell\\\",\\\"presetId\\\":\\\"" + presetId + "\\\",\\\"presetVersion\\\":" + str.tostring(presetVersion) + ",\\\"ts\\\":\\\"" + ts + "\\\"${secretField}}"
    alert(msg, alert.freq_once_per_bar_close)
`
  }

  const tasklist = useMemo(() => assigns.filter(a => a.status !== 'paused').map(a => ({ symbol: a.symbol, timeframe: a.timeframe, presetId: a.preset_id, presetVersion: a.preset_version })), [assigns])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alarm Kurulum Paneli</h1>
        <Badge variant="outline" className="px-3 py-1">Aktif alert: {tasklist.length}</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <Card>
          <CardHeader>
            <CardTitle>Kısa kılavuz</CardTitle>
            <CardDescription>Hızlı başlangıç adımları</CardDescription>
          </CardHeader>
          <CardContent className="text-amber-900">
            <ul className="list-disc pl-5 space-y-1">
              <li>Presets’i yönet, coin×timeframe atamasını yap.</li>
              <li>Pine Script’i kopyala → TV Pine Editor → Save + Add to chart.</li>
              <li>Alert: Condition = Any alert() function call, Trigger = Once per bar close, Message boş.</li>
              <li>Her coin×timeframe için 1 alert yeterlidir.</li>
            </ul>
            <div className="mt-2 text-xs text-amber-800">
              Webhook JSON: {`{symbol,timeframe,indicator,action,presetId,presetVersion,ts,secret}`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Örnek</CardTitle>
            <CardDescription>AVAX, UT Bot 2/18, 4h</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Preset: UTB_A v1, params {`{"key":2,"atr":18}`}</li>
              <li>TF Set: H4 → ["4h"]</li>
              <li>Coin Group: Single AVAX → ["AVAXUSDT"]</li>
              <li>Bulk assignment ile bağla.</li>
              <li>Pine Script kopyala ve TV’ye ekle; alert’i yarat.</li>
            </ol>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Neden Coin/TF Grupları?</CardTitle>
            <CardDescription>Organizasyon ve hız</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              <li>Çoklu atamayı tek işlemde yaparsın.</li>
              <li>Tek sembolde bile akışı standartlaştırır.</li>
              <li>Parametre güncellemesinde tekrar kullanılır.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Presets</CardTitle>
            <CardDescription>Parametre setleri ve versiyonlar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
          <select className="border rounded px-2 py-1" value={selectedPresetId} onChange={e => setSelectedPresetId(e.target.value)}>
            {presets.map(p => <option key={p.id} value={p.id}>{p.name} v{p.version}</option>)}
          </select>
          <div>
            <Button variant="outline" size="sm" className="mt-2" disabled={!selectedPreset}
              onClick={()=>{
                if(!selectedPreset){ alert('Önce bir preset seç'); return }
                const s = buildPineScript(selectedPreset)
                setGeneratedScript(s)
              }}>Pine Script Üret</Button>
          </div>
          <div className="text-xs text-gray-600">Toplam presets: <Badge variant="secondary">{presets.length}</Badge></div>
          <div className="mt-3 border-t pt-3">
            <h3 className="font-medium text-sm mb-2">Yeni Preset Oluştur</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <input className="border rounded px-2 py-1" placeholder="Name (örn. UTB_A)" value={newPreset.name} onChange={e=>setNewPreset({...newPreset,name:e.target.value})} />
              <input className="border rounded px-2 py-1" type="number" placeholder="Version" value={newPreset.version} onChange={e=>setNewPreset({...newPreset,version: Number(e.target.value)||1})} />
              <textarea className="col-span-2 border rounded px-2 py-1 h-20" placeholder='Params JSON ({"key":2,"atr":18})' value={newPreset.paramsText} onChange={e=>setNewPreset({...newPreset,paramsText:e.target.value})} />
              <Button className="col-span-2" disabled={loading}
                onClick={async ()=>{
                  try{
                    setLoading(true)
                    const params = JSON.parse(newPreset.paramsText||'{}')
                    await fetch(`${API_BASE}/admin/presets`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:newPreset.name,indicator:'utbot',version:newPreset.version,params,active:newPreset.active})})
                    await loadAll()
                  }catch(err){ alert('Preset kaydedilemedi: '+(err as any)?.message) } finally{ setLoading(false) }
                }}>Kaydet</Button>
            </div>
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Webhook</CardTitle>
            <CardDescription>URL ve secret</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span>URL:</span>
            <code className="truncate">{webhook?.url || '-'}</code>
            <Button variant="outline" size="sm"
              onClick={async()=>{ if(webhook?.url){ try{ await navigator.clipboard.writeText(webhook.url); alert('URL kopyalandı') }catch{ alert('Kopyalanamadı') } }}}>Kopyala</Button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span>Secret:</span>
            <code className="truncate">{webhook?.secret || '-'}</code>
            <Button variant="outline" size="sm"
              onClick={async()=>{ if(webhook?.secret){ try{ await navigator.clipboard.writeText(webhook.secret); alert('Secret kopyalandı') }catch{ alert('Kopyalanamadı') } }}}>Kopyala</Button>
          </div>
          <p className="text-xs text-gray-600">Alert’te Condition: Any alert(), Message boş. Secret, üretilen Pine Script’e otomatik eklenir.</p>
          </CardContent>
        </Card>
      </div>

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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Assignment</CardTitle>
          <CardDescription>Grup × TF set × preset’i hızlı bağla</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
          <select className="border rounded px-2 py-1" value={bulk.groupId} onChange={e=>setBulk({...bulk,groupId:e.target.value})}>
            <option value="">Grup seç</option>
            {groups.map(g=> <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
          <select className="border rounded px-2 py-1" value={bulk.tfSetId} onChange={e=>setBulk({...bulk,tfSetId:e.target.value})}>
            <option value="">TF set seç</option>
            {tfs.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="border rounded px-2 py-1" value={bulk.presetId || selectedPresetId} onChange={e=>setBulk({...bulk,presetId:e.target.value})}>
            <option value="">Preset seç</option>
            {presets.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <input className="border rounded px-2 py-1" type="number" placeholder="Version" value={bulk.presetVersion} onChange={e=>setBulk({...bulk,presetVersion:Number(e.target.value)||1})} />
          <Button className="px-3 py-2" disabled={loading}
            onClick={async ()=>{
              if(!bulk.groupId || !bulk.tfSetId || !(bulk.presetId||selectedPresetId)) { alert('Alanları seçiniz'); return }
              try{
                setLoading(true)
                await fetch(`${API_BASE}/admin/assignments/bulk`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
                  group_id: bulk.groupId,
                  timeframe_set_id: bulk.tfSetId,
                  preset_id: bulk.presetId || selectedPresetId,
                  preset_version: bulk.presetVersion,
                  status: 'active'
                })})
                await loadAll()
              }catch(err){ alert('Bulk assignment başarısız') } finally{ setLoading(false) }
            }}>Uygula</Button>
        </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pine Script (Copy)</CardTitle>
          <CardDescription>TradingView Pine Editor’a yapıştır</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
        <div className="flex gap-2 text-sm">
          <Button variant="outline" onClick={async()=>{
            if(!generatedScript){ alert('Preset seçip \"Pine Script Üret\"e tıkla'); return }
            try{ await navigator.clipboard.writeText(generatedScript); alert('Script kopyalandı') } catch{ alert('Kopyalanamadı') }
          }}>Kopyala</Button>
          <Button variant="outline" onClick={()=> setGeneratedScript('') }>Temizle</Button>
          {tasklist[0] && (
            <Button asChild variant="outline">
              <a target="_blank" rel="noreferrer" href={`https://www.tradingview.com/chart/?symbol=BINANCE%3A${encodeURIComponent(tasklist[0].symbol)}`}>
                TradingView grafiğini aç
              </a>
            </Button>
          )}
        </div>
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-72">{generatedScript || '// Preset seç ve "Pine Script Üret" butonuna tıkla'}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Özeti</CardTitle>
          <CardDescription>Aktif alertler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-xs">Toplam aktif alert: {tasklist.length}</div>
          <div className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-72">
          <ul className="space-y-1">
            {tasklist.slice(0, 20).map((t,i)=> (
              <li key={i} className="flex justify-between gap-3">
                <span className="font-mono">{t.symbol}</span>
                <span className="font-mono text-gray-600">{t.timeframe}</span>
                <span className="text-gray-500">{t.presetId}@v{t.presetVersion}</span>
              </li>
            ))}
          </ul>
          {tasklist.length > 20 && <div className="mt-2 text-gray-500">+{tasklist.length-20} daha…</div>}
          </div>
          <p className="text-xs text-gray-600">Adımlar: Grafiği aç → timeframe seç → Pine’ı yapıştır/sakla → Alert: Any alert() + Webhook URL → Create.</p>
        </CardContent>
      </Card>
    </div>
  )
}


