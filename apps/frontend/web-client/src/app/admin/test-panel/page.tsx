"use client"
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

type Processed = {
  processedAt: string
  symbol: string
  timeframe: string
  action: 'buy' | 'sell'
}

type Delivery = {
  deliveredAt: string
  userId: string
  channel: string
  symbol: string
  timeframe: string
  action: 'buy' | 'sell'
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'

export default function AdminTestPanel() {
  const [loading, setLoading] = useState(false)
  const [processed, setProcessed] = useState<Processed[]>([])
  const [deliveries, setDeliveries] = useState<(Delivery & { user?: any })[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [webhook, setWebhook] = useState<{ url: string; secret: string } | null>(null)
  const [urlBaseInput, setUrlBaseInput] = useState('')
  const [symbol, setSymbol] = useState('BTCUSDT')
  const [timeframe, setTimeframe] = useState('15m')
  const [action, setAction] = useState<'buy' | 'sell'>('buy')

  const processedUrl = useMemo(() => `${API_BASE}/signals/processed`, [])
  const usersUrl = useMemo(() => `${API_BASE}/admin/users-supabase`, [])
  const notificationsUrl = useMemo(() => `${API_BASE}/admin/notifications`, [])
  const webhookInfoUrl = useMemo(() => `${API_BASE}/admin/webhook`, [])
  const vercelTvEndpoint = typeof window !== 'undefined' ? `${location.origin}/api/tradingview` : ''

  const webhookMessage = useMemo(() => {
    const secret = webhook?.secret || 'SECRET_BURAYA'
    return JSON.stringify(
      {
        symbol: '{{ticker}}',
        timeframe: '{{interval}}',
        action: 'buy',
        timestamp: '{{time}}',
        secret,
        source: 'tradingview',
      },
      null,
      2
    )
  }, [webhook])

  async function seedUsers() {
    setLoading(true)
    await fetch(`${API_BASE}/admin/seed-users-supabase?count=5`, { method: 'POST' })
    await refreshAll()
    setLoading(false)
  }

  async function clearUsers() {
    setLoading(true)
    await fetch(`${API_BASE}/admin/clear-users-supabase`, { method: 'POST' })
    await refreshAll()
    setLoading(false)
  }

  async function clearNotifications() {
    setLoading(true)
    await fetch(`${API_BASE}/admin/clear-notifications`, { method: 'POST' })
    await refreshAll()
    setLoading(false)
  }

  async function simulateSignal() {
    setLoading(true)
    await fetch(`${API_BASE}/admin/simulate-signal`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ symbol, timeframe, action }),
    })
    // Wait a bit for worker to process
    await new Promise((r) => setTimeout(r, 600))
    await refreshAll()
    setLoading(false)
  }

  async function refreshAll() {
    const [p, u, n, w] = await Promise.all([
      fetch(processedUrl).then((r) => r.json()).catch(() => ({ items: [] })),
      fetch(usersUrl).then((r) => r.json()).catch(() => ({ users: [] })),
      fetch(notificationsUrl).then((r) => r.json()).catch(() => ({ items: [] })),
      fetch(webhookInfoUrl).then((r) => r.json()).catch(() => ({ url: '', secret: '' })),
    ])
    setProcessed(p.items ?? [])
    setUsers(u.users ?? [])
    setDeliveries(n.items ?? [])
    if (w?.url) {
      setWebhook({ url: w.url, secret: w.secret || '' })
      const base = String(w.url).replace(/\/signals\/tradingview$/, '')
      setUrlBaseInput(base)
    }
  }

  useEffect(() => {
    refreshAll()
  }, [])

  async function saveWebhookBase() {
    setLoading(true)
    try {
      await fetch(`${API_BASE}/admin/webhook-base`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ urlBase: urlBaseInput }),
      })
      await refreshAll()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="rounded-md border bg-blue-50 p-4 text-sm leading-6 text-blue-900">
        <p className="font-semibold mb-1">Bu sayfa ne için?</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>TradingView olmadan uçtan uca akışı test etmek.</li>
          <li>Seed Users ile Supabase’te dummy kullanıcılar oluştur; Simulate ile sinyal üret.</li>
          <li>Bildirimler ve Processed listelerinden sonucu gözlemle.</li>
        </ul>
      </div>
      <h1 className="text-2xl font-bold">Admin Test Panel</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">TradingView Webhook Bilgileri</CardTitle>
          <CardDescription>URL ve Secret bilgisi; Message JSON’u kopyalayın</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-700">
            <div>
              <b>Webhook URL:</b>{' '}
              {webhook?.url ? (
                <a className="text-blue-600 hover:underline" href={webhook.url} target="_blank" rel="noreferrer">
                  {webhook.url}
                </a>
              ) : (
                <span className="text-gray-500">Yükleniyor...</span>
              )}
            </div>
            <div>
              <b>Secret:</b> <span className="select-all">{webhook?.secret || 'SECRET_BURAYA'}</span>
            </div>
          </div>
          <div className="text-sm">
            <div className="font-medium mb-1">TradingView Message (JSON)</div>
            <pre className="text-xs overflow-auto max-h-64 bg-gray-50 p-3 rounded border">{webhookMessage}</pre>
            <p className="mt-2 text-xs text-gray-600">
              Kısa Özet: 1) Webhook URL’yi TradingView alarmındaki Webhook URL alanına yapıştır. 2) Yukarıdaki JSON’u Message alanına
              yapıştır. 3) Alarmı bar kapanışında tetikle. 4) Aşağıdaki listelerde sonuçları gör.
            </p>
            <div className="mt-2 text-xs">
              <div className="font-semibold">Vercel üzerinde kullanmak istersen:</div>
              <div>Webhook URL: <code className="select-all bg-gray-100 px-1 py-0.5 rounded">{vercelTvEndpoint || '/api/tradingview'}</code></div>
              <div>Not: Vercel ortam değişkenleri: <code>UPSTASH_REDIS_REST_URL</code>, <code>UPSTASH_REDIS_REST_TOKEN</code>, <code>TRADINGVIEW_WEBHOOK_SECRET</code> ayarlı olmalı.</div>
            </div>
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-1">Public URL yoksa (ör. ngrok/lt) aşağıya base URL yapıştırıp kaydet:</div>
              <div className="flex gap-2">
                <input className="border rounded px-2 py-1 flex-1" placeholder="https://xxxx.loca.lt" value={urlBaseInput} onChange={(e) => setUrlBaseInput(e.target.value)} />
                <button disabled={loading} className="px-3 py-2 bg-black text-white rounded" onClick={saveWebhookBase}>Kaydet</button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kullanıcılar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          <h2 className="font-semibold">Kullanıcılar</h2>
          <div className="flex gap-2">
            <button disabled={loading} className="px-3 py-2 bg-black text-white rounded" onClick={seedUsers}>Seed 5 Users</button>
            <button disabled={loading} className="px-3 py-2 border rounded" onClick={clearUsers}>Clear Users</button>
          </div>
          <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(users, null, 2)}</pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sinyal Simülasyonu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          <h2 className="font-semibold">Sinyal Simülasyonu</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2 items-center">
              <label className="w-28">Symbol</label>
              <input className="border rounded px-2 py-1 w-full" value={symbol} onChange={(e) => setSymbol(e.target.value)} />
            </div>
            <div className="flex gap-2 items-center">
              <label className="w-28">Timeframe</label>
              <select className="border rounded px-2 py-1" value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
                {['1m','5m','15m','1h','4h','1d'].map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>
            <div className="flex gap-2 items-center">
              <label className="w-28">Action</label>
              <select className="border rounded px-2 py-1" value={action} onChange={(e) => setAction(e.target.value as any)}>
                {['buy','sell'].map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <button disabled={loading} className="px-3 py-2 bg-indigo-600 text-white rounded" onClick={simulateSignal}>Simulate</button>
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bildirimler (Kime gitti?)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
          <h2 className="font-semibold">Bildirimler (Kime gitti?)</h2>
          <div className="flex gap-2">
            <button disabled={loading} className="px-3 py-2 border rounded" onClick={clearNotifications}>Clear</button>
          </div>
          <div className="text-xs overflow-auto max-h-64 space-y-2">
            {deliveries.length === 0 && <div className="text-gray-500">Henüz teslimat yok.</div>}
            {deliveries.map((d, i) => (
              <div key={i} className="border rounded p-2">
                <div><b>userId:</b> {d.userId}</div>
                <div><b>email:</b> {(d as any).email || d.user?.email || '-'}</div>
                <div><b>channel:</b> {d.channel}</div>
                <div><b>symbol:</b> {d.symbol}</div>
                <div><b>timeframe:</b> {d.timeframe}</div>
                <div><b>action:</b> {d.action}</div>
                <div><b>deliveredAt:</b> {d.deliveredAt}</div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Processed Signals</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto max-h-64">{JSON.stringify(processed, null, 2)}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Akışı</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal pl-6 text-sm space-y-1">
            <li>Seed 5 Users ile dummy kullanıcıları oluşturun.</li>
            <li>Symbol/Timeframe/Action seçip Simulate’a tıklayın.</li>
            <li>Worker sinyali alır, tüm dummy kullanıcılara teslim kayıtları üretir.</li>
            <li>Processed Signals ve Notifications listesinde sonuçları görün.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}


