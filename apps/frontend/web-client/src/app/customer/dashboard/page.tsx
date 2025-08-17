'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Mail, AlertCircle, Plus, TrendingUp, TrendingDown, Activity, Bell, Settings, User, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

interface Coin {
  id: string
  symbol: string
  display_name: string | null
  exchange: string
  active: boolean
  logo_url?: string
}

interface UserAlarm {
  id: string
  email: string
  coin_symbol: string
  action: string
  is_active: boolean
  created_at: string
}

interface TriggeredAlarm {
  id: string
  email: string
  coin_symbol: string
  timeframe: string
  action: string
  triggered_at: string
  signal_timestamp: string
}



export default function CustomerDashboard() {
  const [coins, setCoins] = useState<Coin[]>([])
  const [alarms, setAlarms] = useState<UserAlarm[]>([])
  const [triggeredAlarms, setTriggeredAlarms] = useState<TriggeredAlarm[]>([])
  const [email, setEmail] = useState('emrecanergin12@hotmail.com')
  const [selectedCoin, setSelectedCoin] = useState('')
  const [selectedAction, setSelectedAction] = useState('buy')
  // Timeframe is managed by admin presets, not customer choice
  const [loading, setLoading] = useState(false)

  // Fetch coins from backend API
  const fetchCoins = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://avoalert-api.onrender.com'
      const response = await fetch(`${API_BASE}/admin/coins`)
      if (response.ok) {
        const data = await response.json()
        setCoins(data.items || [])
      } else {
        console.warn('Failed to fetch coins:', response.status)
      }
    } catch (error) {
      console.error('Error fetching coins:', error)
      // Set empty array to prevent infinite loading
      setCoins([])
    }
  }

  // Fetch user alarms
  const fetchAlarms = async () => {
    if (!email) return
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://avoalert-api.onrender.com'
      const response = await fetch(`${API_BASE}/notifications/user-alarms?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        setAlarms(data.alarms || [])
      }
    } catch (error) {
      console.error('Error fetching alarms:', error)
      setAlarms([])
    }
  }

  // Create new alarm
  const createAlarm = async () => {
    if (!email || !selectedCoin || !selectedAction) {
      toast.error('Email, coin ve aksiyon seçimi gerekli!')
      return
    }

    setLoading(true)
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://avoalert-api.onrender.com'
      const response = await fetch(`${API_BASE}/notifications/user-alarms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          coin_symbol: selectedCoin,
          action: selectedAction
        })
      })

      if (response.ok) {
        toast.success('Alarm başarıyla oluşturuldu!')
        await fetchAlarms()
        setSelectedCoin('')
        setSelectedAction('buy')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Alarm oluşturulamadı!')
      }
    } catch (error) {
      toast.error('Beklenmeyen hata!')
      console.error('Error creating alarm:', error)
    } finally {
      setLoading(false)
    }
  }

  // Delete alarm
  const deleteAlarm = async (alarmId: string) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://avoalert-api.onrender.com'
      const response = await fetch(`${API_BASE}/notifications/user-alarms/${alarmId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Alarm silindi!')
        await fetchAlarms()
      } else {
        toast.error('Alarm silinemedi!')
      }
    } catch (error) {
      toast.error('Beklenmeyen hata!')
      console.error('Error deleting alarm:', error)
    }
  }

  // Fetch triggered alarms
  const fetchTriggeredAlarms = async () => {
    if (!email) return
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://avoalert-api.onrender.com'
      const response = await fetch(`${API_BASE}/notifications/triggered-alarms?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        setTriggeredAlarms(data.triggered || [])
      }
    } catch (error) {
      console.error('Error fetching triggered alarms:', error)
      setTriggeredAlarms([])
    }
  }

  useEffect(() => {
    fetchCoins()
  }, [])

  useEffect(() => {
    if (email) {
      fetchAlarms()
      fetchTriggeredAlarms()
    }
  }, [email])

  // Auto-refresh triggered alarms every 3 seconds
  useEffect(() => {
    if (!email) return
    
    const interval = setInterval(() => {
      fetchTriggeredAlarms()
    }, 3000)

    return () => clearInterval(interval)
  }, [email])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AvoAlert</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Kripto Trading Sinyalleri</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{email}</span>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-8">

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Aktif Alarmlar</p>
                  <p className="text-3xl font-bold">{alarms.filter(a => a.is_active).length}</p>
                </div>
                <Bell className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Tetiklenen Alarmlar</p>
                  <p className="text-3xl font-bold">{triggeredAlarms.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Toplam Coin</p>
                  <p className="text-3xl font-bold">{coins.filter(c => c.active).length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alarm Creation */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Yeni Alarm Oluştur</CardTitle>
                  <CardDescription className="text-sm">
                    Trading sinyalleri için otomatik email bildirimi alın
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="coin" className="text-sm font-semibold">Kripto Para</Label>
                <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Coin seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {coins.filter(coin => coin.active).map((coin) => (
                      <SelectItem key={coin.id} value={coin.symbol}>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white border border-slate-200">
                            {coin.logo_url ? (
                              <img 
                                src={coin.logo_url} 
                                alt={coin.symbol}
                                className="w-6 h-6 object-contain"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`${coin.logo_url ? 'hidden' : ''} w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                              {coin.symbol.slice(0, 2)}
                            </div>
                          </div>
                          <div>
                            <div className="font-semibold">{coin.symbol}</div>
                            <div className="text-xs text-muted-foreground">{coin.display_name || coin.symbol}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action" className="text-sm font-semibold">Sinyal Tipi</Label>
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-green-700 dark:text-green-400">BUY Sinyali</div>
                          <div className="text-xs text-muted-foreground">Alım fırsatları</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="sell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-red-700 dark:text-red-400">SELL Sinyali</div>
                          <div className="text-xs text-muted-foreground">Satım fırsatları</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button 
                  onClick={createAlarm} 
                  disabled={loading || !email || !selectedCoin || !selectedAction}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 border-0"
                  size="lg"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Oluşturuluyor...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Alarm Oluştur
                    </div>
                  )}
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Bilgilendirme</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Seçtiğiniz coin için belirlediğiniz sinyal tipinde (BUY/SELL) TradingView&apos;dan sinyal geldiğinde email bildirim alacaksınız.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Active and Triggered Alarms Row */}
        {email && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Active Alarms */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Aktif Alarmlar</CardTitle>
                    <CardDescription className="text-sm">
                      Email bildirimleriniz için tanımlı alarmlar
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {alarms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Henüz alarm oluşturmadınız</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Yukarıdaki formdan yeni alarm oluşturabilirsiniz</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {alarms.map((alarm) => (
                      <div
                        key={`alarm-${alarm.id}`}
                        className="group p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-700 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white border border-slate-200">
                              {(() => {
                                const coin = coins.find(c => c.symbol === alarm.coin_symbol);
                                return coin?.logo_url ? (
                                  <img 
                                    src={coin.logo_url} 
                                    alt={alarm.coin_symbol}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null;
                              })()}
                              <div className={`${(() => {
                                const coin = coins.find(c => c.symbol === alarm.coin_symbol);
                                return coin?.logo_url ? 'hidden' : '';
                              })()} w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-sm`}>
                                {alarm.coin_symbol.slice(0, 3)}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-900 dark:text-white">{alarm.coin_symbol}</span>
                                <Badge 
                                  variant="outline"
                                  className={`
                                    ${alarm.action === 'buy' ? 'border-green-500 text-green-700 bg-green-50 dark:bg-green-950 dark:text-green-400' : ''}
                                    ${alarm.action === 'sell' ? 'border-red-500 text-red-700 bg-red-50 dark:bg-red-950 dark:text-red-400' : ''}
                                  `}
                                >
                                  {alarm.action === 'buy' ? (
                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="h-3 w-3" />
                                      BUY
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <TrendingDown className="h-3 w-3" />
                                      SELL
                                    </div>
                                  )}
                                </Badge>
                                <Badge variant={alarm.is_active ? "default" : "secondary"} className="text-xs">
                                  {alarm.is_active ? "Aktif" : "Pasif"}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Oluşturulma: {new Date(alarm.created_at).toLocaleDateString('tr-TR')}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteAlarm(alarm.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Triggered Alarms */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                    <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Tetiklenen Alarmlar</CardTitle>
                    <CardDescription className="text-sm">
                      Son sinyal tetiklemeleri ve bildirimler
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {triggeredAlarms.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Activity className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Henüz tetiklenen alarm yok</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Alarmlarınız tetiklendiğinde burada görüntülenecek</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                    {triggeredAlarms.map((triggered, index) => (
                      <div
                        key={`triggered-${triggered.id || index}-${triggered.coin_symbol}-${triggered.triggered_at}`}
                        className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white border border-slate-200">
                              {(() => {
                                const coin = coins.find(c => c.symbol === triggered.coin_symbol);
                                return coin?.logo_url ? (
                                  <img 
                                    src={coin.logo_url} 
                                    alt={triggered.coin_symbol}
                                    className="w-8 h-8 object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      target.nextElementSibling?.classList.remove('hidden');
                                    }}
                                  />
                                ) : null;
                              })()}
                              <div className={`${(() => {
                                const coin = coins.find(c => c.symbol === triggered.coin_symbol);
                                return coin?.logo_url ? 'hidden' : '';
                              })()} w-full h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center text-white font-bold text-sm`}>
                                {triggered.coin_symbol.slice(0, 3)}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-slate-900 dark:text-white">{triggered.coin_symbol}</span>
                                <Badge 
                                  variant="outline"
                                  className={`${
                                    triggered.action === 'buy' 
                                      ? 'border-green-500 text-green-700 bg-green-100 dark:bg-green-950 dark:text-green-400' 
                                      : 'border-red-500 text-red-700 bg-red-100 dark:bg-red-950 dark:text-red-400'
                                  }`}
                                >
                                  {triggered.action === 'buy' ? (
                                    <div className="flex items-center gap-1">
                                      <TrendingUp className="h-3 w-3" />
                                      BUY
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1">
                                      <TrendingDown className="h-3 w-3" />
                                      SELL
                                    </div>
                                  )}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {triggered.timeframe}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="space-y-1">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Sinyal Zamanı:</p>
                            <p className="text-slate-700 dark:text-slate-300">{new Date(triggered.signal_timestamp).toLocaleString('tr-TR')}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-slate-500 dark:text-slate-400 font-medium">Tetiklenme:</p>
                            <p className="text-slate-700 dark:text-slate-300">{new Date(triggered.triggered_at).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

      </div>
    </div>
  )
}
