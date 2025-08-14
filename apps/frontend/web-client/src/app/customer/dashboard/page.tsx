'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Mail, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Coin {
  id: string
  symbol: string
  display_name: string | null
  exchange: string
  active: boolean
}

interface UserAlarm {
  id: string
  email: string
  coin_symbol: string
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
  // Timeframe is managed by admin presets, not customer choice
  const [loading, setLoading] = useState(false)

  // Fetch coins from backend API
  const fetchCoins = async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
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
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
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
    if (!email || !selectedCoin) {
      toast.error('Email ve coin seçimi gerekli!')
      return
    }

    setLoading(true)
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
      const response = await fetch(`${API_BASE}/notifications/user-alarms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          coin_symbol: selectedCoin
        })
      })

      if (response.ok) {
        toast.success('Alarm başarıyla oluşturuldu!')
        await fetchAlarms()
        setSelectedCoin('')
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
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
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
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'
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
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Kripto Alarm Paneli</h1>
        <p className="text-muted-foreground mt-2">
          Favori coinleriniz için email alarmları kurun
        </p>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Kullanıcı: {email}
          </CardTitle>
          <CardDescription>
            Alarm bildirimleri bu email adresine gönderilecek
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Alarm Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Yeni Alarm Oluştur
          </CardTitle>
          <CardDescription>
            Belirli bir coin için trading sinyali aldığınızda email bildirimi alın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="coin">Coin</Label>
              <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                <SelectTrigger>
                  <SelectValue placeholder="Coin seçin" />
                </SelectTrigger>
                <SelectContent>
                  {coins.filter(coin => coin.active).map((coin) => (
                    <SelectItem key={coin.id} value={coin.symbol}>
                      {coin.symbol} - {coin.display_name || coin.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Tüm zaman dilimleri için alarm alacaksınız
              </p>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={createAlarm} 
                disabled={loading || !email || !selectedCoin}
                className="w-full"
              >
                {loading ? 'Oluşturuluyor...' : 'Alarm Oluştur'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active and Triggered Alarms Row */}
      {email && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Alarms */}
          <Card>
            <CardHeader>
              <CardTitle>Aktif Alarmlar</CardTitle>
              <CardDescription>
                Email adresiniz için oluşturulmuş alarmlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alarms.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Henüz alarm oluşturmadınız.
                </p>
              ) : (
                <div className="space-y-3">
                                  {alarms.map((alarm) => (
                  <div
                    key={`alarm-${alarm.id}`}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-lg font-semibold">
                          {alarm.coin_symbol}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Tüm zaman dilimleri
                        </span>
                        <Badge variant={alarm.is_active ? "default" : "secondary"}>
                          {alarm.is_active ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteAlarm(alarm.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Triggered Alarms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Tetiklenen Alarmlar
              </CardTitle>
              <CardDescription>
                Son webhook sinyalleri ile tetiklenen alarmlar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {triggeredAlarms.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Henüz tetiklenen alarm yok.
                </p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {triggeredAlarms.map((triggered, index) => (
                    <div
                      key={`triggered-${triggered.id || index}-${triggered.coin_symbol}-${triggered.triggered_at}`}
                      className="p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-red-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant="outline" 
                            className="text-lg font-semibold border-orange-300"
                          >
                            {triggered.coin_symbol}
                          </Badge>
                          <Badge 
                            variant={triggered.action === 'buy' ? 'default' : 'destructive'}
                            className="uppercase"
                          >
                            {triggered.action}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {triggered.timeframe}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Signal: {new Date(triggered.signal_timestamp).toLocaleString('tr-TR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Triggered: {new Date(triggered.triggered_at).toLocaleString('tr-TR')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Popular Coins Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Popüler Coinler</CardTitle>
          <CardDescription>
            En çok takip edilen kripto paralar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {coins.slice(0, 12).map((coin) => (
              <div
                key={`coin-${coin.id}`}
                className="p-4 border rounded-lg text-center hover:bg-muted/50 cursor-pointer"
                onClick={() => setSelectedCoin(coin.symbol)}
              >
                <div className="font-semibold">{coin.symbol}</div>
                <div className="text-sm text-muted-foreground">
                  {coin.display_name || coin.symbol}
                </div>
                <Badge variant="outline" className="mt-2">
                  {coin.exchange}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
