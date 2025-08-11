"use client"
import { useEffect, useMemo, useState } from 'react'

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
    return `//@version=5
indicator("AvoAlert Multi", overlay=true)

// Preset: ${preset.name} v${preset.version}
// PresetId: ${preset.id}
// Params: ${pj}

// Preset kimliği
presetId = "${preset.name}"
presetVersion = ${preset.version}

// Basit sinyal örneği: 10 SMA
ma = ta.sma(close, 10)
plot(ma, color=color.new(color.blue, 0), title="MA10")

condBuy  = ta.crossover(close, ma)
condSell = ta.crossunder(close, ma)

// TradingView alertcondition sabit (const) mesaj ister
alertcondition(condBuy,  title="UTBOT BUY",  message="UTBOT BUY")
alertcondition(condSell, title="UTBOT SELL", message="UTBOT SELL")

// Tek alert kuracaksan: Condition = Any alert() function call, Message boş bırak
if condBuy
    ts  = str.tostring(time)
    msg = "{\\\"indicator\\\":\\\"utbot\\\",\\\"action\\\":\\\"buy\\\",\\\"presetId\\\":\\\"" + presetId + "\\\",\\\"presetVersion\\\":" + str.tostring(presetVersion) + ",\\\"ts\\\":\\\"" + ts + "\\\"}"
    alert(msg, alert.freq_once_per_bar_close)

if condSell
    ts  = str.tostring(time)
    msg = "{\\\"indicator\\\":\\\"utbot\\\",\\\"action\\\":\\\"sell\\\",\\\"presetId\\\":\\\"" + presetId + "\\\",\\\"presetVersion\\\":" + str.tostring(presetVersion) + ",\\\"ts\\\":\\\"" + ts + "\\\"}"
    alert(msg, alert.freq_once_per_bar_close)
`
  }

  const tasklist = useMemo(() => assigns.filter(a => a.status !== 'paused').map(a => ({ symbol: a.symbol, timeframe: a.timeframe, presetId: a.preset_id, presetVersion: a.preset_version })), [assigns])

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Alarm Kurulum Paneli</h1>
      <div className="rounded-md border bg-amber-50 p-4 text-sm leading-6 text-amber-900">
        <p className="font-semibold mb-1">Kısa kılavuz</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Presets sekmesinden UT Bot A/B gibi parametre setlerini ve versiyonlarını yönet.</li>
          <li>Coin × Timeframe atamasını yap; toplam kaç alert gerektiğini aşağıdaki özetten gör.</li>
          <li>Pine Script (Copy) içeriğini TradingView → Pine Editor’a yapıştır, Save + Add to chart.</li>
          <li>Alert oluştur: Condition = <b>Any alert() function call</b>, Trigger = <b>Once per bar close</b>, Message boş, Webhook URL aşağıdaki değeri kullan.</li>
          <li>Her coin × timeframe için 1 alert kurulur. Parametre değiştiğinde yeni versiyonu seçip scripti güncellemen yeterli.</li>
        </ul>
        <div className="mt-2 text-xs text-amber-800">
          Webhook JSON örneği: {`{symbol, timeframe, indicator:"utbot", action:"buy|sell", presetId, presetVersion, ts, secret}`}
        </div>
        <div className="mt-3 border-t pt-3">
          <p className="font-semibold mb-1">Örnek (AVAX, UT Bot 2/18 ve 4h)</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>
              Presets → Yeni Preset: name=
              <code className="mx-1">UTB_A</code>, version=
              <code className="mx-1">1</code>, params=
              <code className="mx-1">{"{ \"key\": 2, \"atr\": 18 }"}</code>
              → Kaydet.
            </li>
            <li>
              Timeframe Setleri → Yeni Set: name=
              <code className="mx-1">H4</code>, timeframes=
              <code className="mx-1">["4h"]</code>
              → Kaydet.
            </li>
            <li>
              Coin Grupları → Yeni Grup: name=
              <code className="mx-1">Single AVAX</code>, symbols=
              <code className="mx-1">["AVAXUSDT"]</code>
              → Kaydet.
            </li>
            <li>
              Bulk Assignment → group=
              <code className="mx-1">Single AVAX</code>, tf set=
              <code className="mx-1">H4</code>, preset=
              <code className="mx-1">UTB_A v1</code>
              → Uygula.
            </li>
            <li>Pine Script (Copy) → TV’de AVAX/USDT grafiği + 4h → Pine Editor’a yapıştır, Save + Add to chart.</li>
            <li>Alert: Any alert() + Webhook URL (Message boş) → Create.</li>
          </ol>
        </div>
        <div className="mt-3 border-t pt-3">
          <p className="font-semibold mb-1">Neden Coin/TF Grupları?</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Çoklu atama için hız kazandırır: 25 coin’i tek seferde aynı preset@version ve TF set ile eşleyebilirsin.</li>
            <li>Tek coin/timeframe senaryosunda da kullanılabilir: 1 sembollü grup + 1 öğeli TF set oluşturmak yeterli.</li>
            <li>2 ayda bir parametre değiştiğinde, aynı grupları kullanıp hızla yeni assignment üretebilirsin.</li>
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4 space-y-3">
          <h2 className="font-semibold">Presets</h2>
          <select className="border rounded px-2 py-1" value={selectedPresetId} onChange={e => setSelectedPresetId(e.target.value)}>
            {presets.map(p => <option key={p.id} value={p.id}>{p.name} v{p.version}</option>)}
          </select>
          <div>
            <button className="mt-2 px-3 py-2 border rounded text-sm" disabled={!selectedPreset}
              onClick={()=>{
                if(!selectedPreset){ alert('Önce bir preset seç'); return }
                const s = buildPineScript(selectedPreset)
                setGeneratedScript(s)
              }}>Pine Script Üret</button>
          </div>
          <div className="text-xs text-gray-600">Toplam presets: {presets.length}</div>
          <div className="mt-3 border-t pt-3">
            <h3 className="font-medium text-sm mb-2">Yeni Preset Oluştur</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <input className="border rounded px-2 py-1" placeholder="Name (örn. UTB_A)" value={newPreset.name} onChange={e=>setNewPreset({...newPreset,name:e.target.value})} />
              <input className="border rounded px-2 py-1" type="number" placeholder="Version" value={newPreset.version} onChange={e=>setNewPreset({...newPreset,version: Number(e.target.value)||1})} />
              <textarea className="col-span-2 border rounded px-2 py-1 h-20" placeholder='Params JSON ({"key":2,"atr":18})' value={newPreset.paramsText} onChange={e=>setNewPreset({...newPreset,paramsText:e.target.value})} />
              <button className="col-span-2 px-3 py-2 bg-black text-white rounded" disabled={loading}
                onClick={async ()=>{
                  try{
                    setLoading(true)
                    const params = JSON.parse(newPreset.paramsText||'{}')
                    await fetch(`${API_BASE}/admin/presets`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:newPreset.name,indicator:'utbot',version:newPreset.version,params,active:newPreset.active})})
                    await loadAll()
                  }catch(err){ alert('Preset kaydedilemedi: '+(err as any)?.message) } finally{ setLoading(false) }
                }}>Kaydet</button>
            </div>
          </div>
        </div>

        <div className="border rounded p-4 space-y-3">
          <h2 className="font-semibold">Webhook</h2>
          <div className="text-sm">URL: <code>{webhook?.url || '-'}</code></div>
          <div className="text-sm">Secret: <code>{webhook?.secret || '-'}</code></div>
          <p className="text-xs text-gray-600">TradingView alert’te Condition: Any alert() ve Message boş bırakılabilir.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded p-4 space-y-3">
          <h2 className="font-semibold">Coin Grupları</h2>
          <div className="text-xs text-gray-600">Toplam grup: {groups.length}</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <input className="border rounded px-2 py-1" placeholder="Group Name" value={newGroup.name} onChange={e=>setNewGroup({...newGroup,name:e.target.value})} />
            <input className="border rounded px-2 py-1" placeholder="Symbols (CSV)" value={newGroup.symbolsText} onChange={e=>setNewGroup({...newGroup,symbolsText:e.target.value})} />
            <button className="col-span-2 px-3 py-2 bg-black text-white rounded" disabled={loading}
              onClick={async ()=>{
                try{
                  setLoading(true)
                  const symbols = newGroup.symbolsText.split(/[\s,]+/).filter(Boolean)
                  await fetch(`${API_BASE}/admin/groups`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:newGroup.name,symbols})})
                  await loadAll()
                }catch(err){ alert('Grup kaydedilemedi') } finally{ setLoading(false) }
              }}>Grup Kaydet</button>
          </div>
        </div>

        <div className="border rounded p-4 space-y-3">
          <h2 className="font-semibold">Timeframe Setleri</h2>
          <div className="text-xs text-gray-600">Toplam set: {tfs.length}</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <input className="border rounded px-2 py-1" placeholder="Set Name" value={newTF.name} onChange={e=>setNewTF({...newTF,name:e.target.value})} />
            <input className="border rounded px-2 py-1" placeholder="TFs (CSV) örn: 15m,1h,4h" value={newTF.timeframesText} onChange={e=>setNewTF({...newTF,timeframesText:e.target.value})} />
            <button className="col-span-2 px-3 py-2 bg-black text-white rounded" disabled={loading}
              onClick={async ()=>{
                try{
                  setLoading(true)
                  const timeframes = newTF.timeframesText.split(/[\s,]+/).filter(Boolean)
                  await fetch(`${API_BASE}/admin/timeframes`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name:newTF.name,timeframes})})
                  await loadAll()
                }catch(err){ alert('Timeframe set kaydedilemedi') } finally{ setLoading(false) }
              }}>Set Kaydet</button>
          </div>
        </div>
      </div>

      <div className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Bulk Assignment</h2>
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
          <button className="px-3 py-2 bg-indigo-600 text-white rounded" disabled={loading}
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
            }}>Uygula</button>
        </div>
      </div>

      <div className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Pine Script (Copy)</h2>
        <div className="flex gap-2 text-sm">
          <button className="px-3 py-2 border rounded" onClick={async()=>{
            if(!generatedScript){ alert('Preset seçip "Pine Script Üret"e tıkla'); return }
            try{ await navigator.clipboard.writeText(generatedScript); alert('Script kopyalandı') } catch{ alert('Kopyalanamadı') }
          }}>Kopyala</button>
          {tasklist[0] && (
            <a className="px-3 py-2 border rounded" target="_blank" rel="noreferrer"
               href={`https://www.tradingview.com/chart/?symbol=BINANCE%3A${encodeURIComponent(tasklist[0].symbol)}`}>
              TradingView grafiğini aç
            </a>
          )}
        </div>
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-72">{generatedScript || '// Preset seç ve "Pine Script Üret" butonuna tıkla'}</pre>
      </div>

      <div className="border rounded p-4 space-y-3">
        <h2 className="font-semibold">Assignment Özeti</h2>
        <div className="text-xs">Toplam aktif alert: {tasklist.length} (coin×timeframe)</div>
        <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-72">{JSON.stringify(tasklist, null, 2)}</pre>
        <p className="text-xs text-gray-600">Adımlar: Grafiği aç → timeframe seç → Pine’ı yapıştır/sakla → Alert: Any alert() + Webhook URL → Create.</p>
      </div>
    </div>
  )
}


