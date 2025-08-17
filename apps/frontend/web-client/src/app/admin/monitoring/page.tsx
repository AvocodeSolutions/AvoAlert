"use client"
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, BarChart3, Clock, Database, RefreshCw, Zap, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://avoalert-api.onrender.com'

type QueueStats = { qSignal: number; processed: number; notifications: number; enqueued: number }
type Processed = { processedAt: string; symbol: string; timeframe: string; action: 'buy' | 'sell' }

export default function MonitoringPage() {
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [processed, setProcessed] = useState<Processed[]>([])
  const [queuePeek, setQueuePeek] = useState<any[]>([])
  const [enqueued, setEnqueued] = useState<any[]>([])
  const [refreshMs, setRefreshMs] = useState(2000)
  const [busy, setBusy] = useState(false)

  const statsUrl = useMemo(() => `${API_BASE}/admin/queue-stats`, [])
  const processedUrl = useMemo(() => `${API_BASE}/signals/processed`, [])
  const peekUrl = useMemo(() => `${API_BASE}/admin/queue-peek?limit=20`, [])
  const enqueuedUrl = useMemo(() => `${API_BASE}/admin/enqueued`, [])

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Monitoring</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Gerçek Zamanlı Sistem İzleme</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <Select value={refreshMs.toString()} onValueChange={(value) => setRefreshMs(Number(value))}>
                  <SelectTrigger className="w-24 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1000, 2000, 5000, 10000, 30000].map((ms) => (
                      <SelectItem key={ms} value={ms.toString()}>
                        {ms < 1000 ? `${ms}ms` : `${ms/1000}s`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={busy} 
                onClick={refreshAll}
                className="h-9"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${busy ? 'animate-spin' : ''}`} />
                Yenile
              </Button>
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
                  <p className="text-blue-100 text-sm font-medium">Kuyruk Uzunluğu</p>
                  <p className="text-4xl font-bold">{stats?.qSignal ?? 0}</p>
                  <p className="text-blue-200 text-xs mt-1">Bekleyen sinyaller</p>
                </div>
                <Database className="h-10 w-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Toplam Kuyruğa Alınan</p>
                  <p className="text-4xl font-bold">{stats?.enqueued ?? 0}</p>
                  <p className="text-green-200 text-xs mt-1">Tüm zamanlar</p>
                </div>
                <TrendingUp className="h-10 w-10 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">İşlenen Sinyaller</p>
                  <p className="text-4xl font-bold">{stats?.processed ?? 0}</p>
                  <p className="text-purple-200 text-xs mt-1">Son işlenenler</p>
                </div>
                <CheckCircle className="h-10 w-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Bildirimler</p>
                  <p className="text-4xl font-bold">{stats?.notifications ?? 0}</p>
                  <p className="text-orange-200 text-xs mt-1">Gönderilen emailler</p>
                </div>
                <Zap className="h-10 w-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Views */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Kuyruk İçeriği</CardTitle>
                  <CardDescription className="text-sm">
                    Bekleyen sinyallerin son 20 tanesi
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {queuePeek.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Database className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Kuyruk boş</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Yeni sinyaller burada görünecek</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {queuePeek.map((item, index) => (
                    <div key={index} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="font-mono">
                          {item.symbol || 'N/A'}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {item.timeframe || 'N/A'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        <span className={`inline-block px-2 py-1 rounded text-white ${
                          item.action === 'buy' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {item.action?.toUpperCase() || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">İşlenen Sinyaller</CardTitle>
                  <CardDescription className="text-sm">
                    Başarıyla işlenen son sinyaller
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {processed.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Henüz işlenen sinyal yok</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">İşlenen sinyaller burada görünecek</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                  {processed.map((item, index) => (
                    <div key={index} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="font-mono border-green-300 text-green-700 dark:border-green-700 dark:text-green-400">
                          {item.symbol}
                        </Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {item.timeframe}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`inline-block px-2 py-1 rounded text-white text-xs ${
                          item.action === 'buy' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {item.action.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {new Date(item.processedAt).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enqueued Signals */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-xl">Son Kuyruğa Alınan Sinyaller</CardTitle>
                <CardDescription className="text-sm">
                  Sisteme en son gelen webhook sinyalleri
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {enqueued.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">Henüz kuyruğa alınan sinyal yok</p>
                <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Yeni webhook sinyalleri burada görünecek</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto custom-scrollbar">
                {enqueued.map((item, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-3">
                      <Badge variant="outline" className="font-mono border-purple-300 text-purple-700 dark:border-purple-700 dark:text-purple-400">
                        {item.symbol || 'N/A'}
                      </Badge>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {item.timeframe || 'N/A'}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`inline-block px-2 py-1 rounded text-white text-xs ${
                          item.action === 'buy' ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          {item.action?.toUpperCase() || 'N/A'}
                        </span>
                        {item.price && (
                          <span className="text-xs font-mono text-slate-600 dark:text-slate-300">
                            ${typeof item.price === 'number' ? item.price.toLocaleString() : item.price}
                          </span>
                        )}
                      </div>
                      {item.timestamp && (
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(item.timestamp).toLocaleString('tr-TR')}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}