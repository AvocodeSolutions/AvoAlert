"use client"
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const API_BASE = '' // use local Next.js API routes on Vercel: /api/monitor/*

type QueueStats = { qSignal: number; processed: number; notifications: number }
type Processed = { processedAt: string; symbol: string; timeframe: string; action: 'buy' | 'sell' }

export default function MonitoringPage() {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [processed, setProcessed] = useState<Processed[]>([])
  const [queuePeek, setQueuePeek] = useState<any[]>([])
  const [enqueued, setEnqueued] = useState<any[]>([])
  const [refreshMs, setRefreshMs] = useState(2000)
  const [busy, setBusy] = useState(false)

  const statsUrl = useMemo(() => `/api/monitor/queue-stats`, [])
  const processedUrl = useMemo(() => `/api/monitor/processed`, [])
  const peekUrl = useMemo(() => `/api/monitor/queue-peek?limit=20`, [])
  const enqueuedUrl = useMemo(() => `/api/monitor/enqueued`, [])

  async function refreshAll() {
    setBusy(true)
    const [s, p, k, e] = await Promise.all([
      fetch(statsUrl).then((r) => r.json()).catch(() => ({})),
      fetch(processedUrl).then((r) => r.json()).catch(() => ({ items: [] })),
      fetch(peekUrl).then((r) => r.json()).catch(() => ({ items: [] })),
      fetch(enqueuedUrl).then((r) => r.json()).catch(() => ({ items: [] })),
    ])
    setStats(s)
    setProcessed(p.items ?? [])
    setQueuePeek(k.items ?? [])
    setEnqueued(e.items ?? [])
    setBusy(false)
  }

  useEffect(() => {
    refreshAll()
  }, [])

  useEffect(() => {
    const id = setInterval(refreshAll, refreshMs)
    return () => clearInterval(id)
  }, [refreshMs])

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Monitoring</h1>
            <p className="mt-1 text-gray-600 text-sm">Kuyruk ve işlenen sinyallerin gerçek zamanlı izlenmesi</p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <label>Refresh</label>
            <select className="border rounded px-2 py-1" value={refreshMs} onChange={(e) => setRefreshMs(Number(e.target.value))}>
              {[1000, 2000, 5000, 10000, 30000].map((ms) => (
                <option key={ms} value={ms}>{ms} ms</option>
              ))}
            </select>
            <button disabled={busy} className="px-3 py-2 border rounded" onClick={refreshAll}>Yenile</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardDescription>Queue Length</CardDescription>
              <CardTitle className="text-3xl">{stats?.qSignal ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Processed (last)</CardDescription>
              <CardTitle className="text-3xl">{stats?.processed ?? 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardDescription>Deliveries</CardDescription>
              <CardTitle className="text-3xl">{stats?.notifications ?? 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Queue Peek (tail)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(queuePeek, null, 2)}</pre>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processed Signals</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(processed, null, 2)}</pre>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enqueued (latest)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96">{JSON.stringify(enqueued, null, 2)}</pre>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}