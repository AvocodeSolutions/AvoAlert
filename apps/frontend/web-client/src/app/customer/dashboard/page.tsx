'use client'

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, AlertCircle, Plus, TrendingUp, TrendingDown, Activity, Bell, Settings, User, BarChart3 } from 'lucide-react'
import { toast } from 'sonner'

interface Coin {
  id: string
  symbol: string
  display_name: string | null
  exchange: string
  active: boolean
  logo_url?: string
}

// Memoized table row component for better performance
const PriceTableRow = React.memo(function PriceTableRow({ 
  coin, 
  symbol, 
  priceData, 
  failedLogos, 
  setFailedLogos, 
  onAlarmCreate,
  getDummySvg,
  shouldUseDummySvg 
}: {
  coin: Coin | undefined
  symbol: string
  priceData: PriceData
  failedLogos: Set<string>
  setFailedLogos: React.Dispatch<React.SetStateAction<Set<string>>>
  onAlarmCreate: (symbol: string, action: 'buy' | 'sell') => void
  getDummySvg: (symbol: string) => string
  shouldUseDummySvg: (symbol: string) => boolean
}) {

  return (
    <div key={symbol} className="grid grid-cols-12 items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
      {/* Rank */}
      <div className="col-span-1 text-slate-500 font-mono text-sm">
        #{Array.from(new Set([symbol])).indexOf(symbol) + 1}
      </div>
      
      {/* Coin Info */}
      <div className="col-span-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
          <img 
            src={
              shouldUseDummySvg(symbol)
                ? getDummySvg(symbol)
                : coin?.logo_url || getDummySvg(symbol)
            }
            alt={symbol}
            className="w-6 h-6 object-contain rounded-full"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!failedLogos.has(symbol)) {
                console.log(`🔧 Switching to dummy SVG for ${symbol}`);
                setFailedLogos(prev => new Set([...prev, symbol]));
                target.src = getDummySvg(symbol);
              }
            }}
          />
        </div>
        <div>
          <div className="font-semibold text-slate-900 dark:text-white">{symbol}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {coin?.display_name || symbol.replace('USDT', '')}
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="col-span-2 text-right">
        <div className="font-semibold text-slate-900 dark:text-white">
          ${priceData.price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
        </div>
      </div>

      {/* 24h Change */}
      <div className="col-span-2 flex items-center justify-end">
        {priceData.change24h !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
            priceData.change24h >= 0 
              ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20' 
              : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
          }`}>
            {priceData.change24h >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {priceData.change24h >= 0 ? '+' : ''}
            {priceData.change24h.toFixed(2)}%
          </div>
        )}
      </div>
      
      {/* Last Update */}
      <div className="col-span-3 flex items-center justify-end text-xs text-slate-400">
        {new Date(priceData.lastUpdate).toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit', 
          second: '2-digit'
        })}
      </div>
    </div>
  )
})

interface PriceData {
  symbol: string
  price: number
  change24h?: number
  lastUpdate: string
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



const CustomerDashboard = memo(() => {
  const [coins, setCoins] = useState<Coin[]>([])
  const [alarms, setAlarms] = useState<UserAlarm[]>([])
  const [triggeredAlarms, setTriggeredAlarms] = useState<TriggeredAlarm[]>([])
  const [prices, setPrices] = useState<Map<string, PriceData>>(new Map())
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false)
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set())

  // Alternative logo service function (unused but kept for reference)
  // const getAlternativeLogo = useCallback((symbol: string) => {
  //   const cleanSymbol = symbol.replace('USDT', '').toLowerCase()
  //   // Try multiple CDNs as fallback
  //   return [
  //     `https://cryptologos.cc/logos/${cleanSymbol}-${cleanSymbol}-logo.png`,
  //     `https://assets.coingecko.com/coins/images/1/large/${cleanSymbol}.png`,
  //     `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/32/color/${cleanSymbol}.png`,
  //     `https://s2.coinmarketcap.com/static/img/coins/64x64/${getCoingeckoId(cleanSymbol)}.png`
  //   ]
  // }, [])

  // Mapping for popular coins to CoinMarketCap IDs
  const getCoingeckoId = (symbol: string): string => {
    const mapping: {[key: string]: string} = {
      'btc': '1', 'eth': '1027', 'bnb': '1839', 'xrp': '52', 'ada': '2010',
      'doge': '74', 'matic': '3890', 'sol': '5426', 'ltc': '2', 'avax': '5805',
      'link': '1975', 'atom': '3794', 'dot': '6636', 'uni': '7083', 'aave': '7278'
    }
    return mapping[symbol] || '1' // Default to Bitcoin if not found
  }
  // Removed pagination states for better performance
  const [email, setEmail] = useState('emrecanergin12@hotmail.com')
  const [selectedCoin, setSelectedCoin] = useState('')
  const [selectedAction, setSelectedAction] = useState('buy')
  // Timeframe is managed by admin presets, not customer choice
  const [loading, setLoading] = useState(false)

  // Fetch coins from backend API - memoized
  const fetchCoins = useCallback(async () => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${API_BASE}/admin/coins`)
      if (response.ok) {
        const data = await response.json()
        setCoins(data.items || [])
      } else {
        console.error('Failed to fetch coins:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching coins:', error)
      setCoins([]) // Set empty array to prevent infinite loading
    }
  }, [])

  // Memoized active coins to prevent unnecessary re-renders
  const activeCoins = useMemo(() => coins.filter(coin => coin.active), [coins])

  // WebSocket connection for real-time prices
  const connectWebSocket = useCallback(() => {
    if (activeCoins.length === 0) return

    const symbols = activeCoins
      .map(coin => coin.symbol)
      .filter(symbol => symbol && symbol.trim())
      .slice(0, 100)

    if (symbols.length === 0) return

    console.log('🔌 Connecting WebSocket for', symbols.length, 'symbols')
    
    // Use Binance WebSocket directly
    const wsUrl = 'wss://stream.binance.com:9443/ws'
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log('✅ WebSocket connected')
      // Subscribe to ticker streams for all symbols
      const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`)
      const subscribeMessage = {
        method: 'SUBSCRIBE',
        params: streams,
        id: 1
      }
      ws.send(JSON.stringify(subscribeMessage))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        // Skip subscription confirmation messages
        if (data.result === null) {
          console.log('✅ WebSocket subscription confirmed')
          return
        }
        
        if (data.stream && data.data) {
          const ticker = data.data
          const symbol = ticker.s
          
          if (symbol) {
            console.log(`💰 Price update: ${symbol} = $${ticker.c}`)
            
            const priceData: PriceData = {
              symbol,
              price: parseFloat(ticker.c), // Current price
              change24h: parseFloat(ticker.P), // 24h change percentage
              lastUpdate: new Date().toISOString()
            }

            setPrices(prevPrices => {
              const newPrices = new Map(prevPrices)
              newPrices.set(symbol, priceData)
              return newPrices
            })
          }
        } else {
          console.log('📨 WebSocket message:', data)
        }
      } catch (error) {
        console.error('WebSocket message error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('🔌 WebSocket closed')
      // Reconnect after 5 seconds
      setTimeout(connectWebSocket, 5000)
    }

    return ws
  }, [activeCoins])

  // Fetch user alarms - memoized
  const fetchAlarms = useCallback(async () => {
    if (!email) return
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${API_BASE}/notifications/user-alarms?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        setAlarms(data.alarms || [])
      }
    } catch (error) {
      console.error('Error fetching alarms:', error)
      setAlarms([])
    }
  }, [email])

  // Create new alarm - memoized
  const createAlarm = useCallback(async () => {
    if (!email || !selectedCoin || !selectedAction) {
      toast.error('Email, coin ve aksiyon seçimi gerekli!')
      return
    }

    setLoading(true)
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
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
        let errorMessage = 'Alarm oluşturulamadı!'
        try {
          const errorData = await response.json()
          errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Beklenmeyen hata!'
      toast.error(`Bağlantı hatası: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }, [email, selectedCoin, selectedAction])

  // Delete alarm - memoized
  const deleteAlarm = useCallback(async (alarmId: string) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
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
    }
  }, [])

  // Fetch triggered alarms - memoized
  const fetchTriggeredAlarms = useCallback(async () => {
    if (!email) return
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
      const response = await fetch(`${API_BASE}/notifications/triggered-alarms?email=${encodeURIComponent(email)}`)
      if (response.ok) {
        const data = await response.json()
        setTriggeredAlarms(data.triggered || [])
      }
    } catch (error) {
      console.error('Error fetching triggered alarms:', error)
      setTriggeredAlarms([])
    }
  }, [email])

  // Problematic coins that should always use dummy SVG
  const BLACKLISTED_LOGOS = new Set(['COTIUSDT', 'CELOUSDT', 'DYDXUSDT', 'ENJUSDT', 'HBARUSDT'])

  // Generate dummy SVG for failed logos
  const getDummySvg = useCallback((symbol: string) => {
    const cleanSymbol = symbol.replace('USDT', '').slice(0, 3)
    const colors = ['#3B82F6', '#8B5CF6', '#EF4444', '#10B981', '#F59E0B', '#EC4899']
    const colorIndex = cleanSymbol.charCodeAt(0) % colors.length
    const color = colors[colorIndex]
    
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="16" fill="${color}"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12" font-weight="bold">${cleanSymbol}</text>
      </svg>
    `)}`
  }, [])

  // Check if coin should use dummy SVG
  const shouldUseDummySvg = useCallback((symbol: string) => {
    return BLACKLISTED_LOGOS.has(symbol) || failedLogos.has(symbol)
  }, [failedLogos])

  // Preload and validate logos
  const preloadLogos = useCallback((coins: Coin[]) => {
    console.log('🖼️ Validating logos and creating dummies for failed ones...')
    let checkedCount = 0
    
    coins.forEach(coin => {
      if (coin.logo_url && !failedLogos.has(coin.symbol)) {
        const img = new Image()
        img.onload = () => {
          checkedCount++
          if (checkedCount === coins.filter(c => c.logo_url).length) {
            console.log(`✅ Logo validation completed`)
          }
        }
        img.onerror = () => {
          console.log(`🔧 Creating dummy SVG for ${coin.symbol}`)
          setFailedLogos(prev => new Set([...prev, coin.symbol]))
        }
        img.src = coin.logo_url
      }
    })
  }, [failedLogos])

  // FAST initial data load - coins and WebSocket
  useEffect(() => {
    console.log('🚀 FAST loading - coins first, then WebSocket connection')
    
    // Load coins immediately
    fetchCoins()

    if (email) {
      fetchAlarms()
      fetchTriggeredAlarms()
    }
  }, [fetchCoins, email])

  // Preload logos when coins are loaded
  useEffect(() => {
    if (coins.length > 0) {
      preloadLogos(coins.slice(0, 15)) // Reduced to 15 for faster preload
    }
  }, [coins.length, preloadLogos])

  // Connect WebSocket when coins are loaded
  useEffect(() => {
    if (activeCoins.length > 0) {
      const ws = connectWebSocket()
      
      return () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.close()
        }
      }
    }
  }, [activeCoins.length, connectWebSocket])

  // Report failed logos after load
  useEffect(() => {
    if (failedLogos.size > 0) {
      console.group('🚨 Failed Logo URLs Summary:');
      Array.from(failedLogos).forEach(symbol => {
        const coin = coins.find(c => c.symbol === symbol);
        console.error(`${symbol}: ${coin?.logo_url}`);
      });
      console.groupEnd();
      console.log(`Total failed logos: ${failedLogos.size}/${coins.length}`);
    }
  }, [failedLogos.size, coins])

  // Auto-refresh triggered alarms every 30 seconds (extreme optimization)
  useEffect(() => {
    if (!email) return
    
    const interval = setInterval(() => {
      fetchTriggeredAlarms()
    }, 30000)

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
                  <p className="text-purple-100 text-sm font-medium">Anlık Fiyat Verisi</p>
                  <p className="text-3xl font-bold">{prices.size}</p>
                  <p className="text-xs text-purple-200 mt-1">
                    {prices.size > 0 ? 'Son güncelleme: Az önce' : 'Yükleniyor...'}
                  </p>
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
                  <SelectContent className="max-h-[300px]">
                    {/* Show popular coins first for faster selection */}
                    {activeCoins
                      .sort((a, b) => {
                        const popularCoins = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'MATICUSDT', 'SOLUSDT']
                        const aIndex = popularCoins.indexOf(a.symbol)
                        const bIndex = popularCoins.indexOf(b.symbol)
                        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
                        if (aIndex !== -1) return -1
                        if (bIndex !== -1) return 1
                        return a.symbol.localeCompare(b.symbol)
                      })
                      .slice(0, 50) // Limit to first 50 coins to prevent dropdown lag
                      .map((coin) => (
                      <SelectItem key={coin.id} value={coin.symbol}>
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden bg-white border border-slate-200">
                            <img 
                              src={
                                shouldUseDummySvg(coin.symbol)
                                  ? getDummySvg(coin.symbol)
                                  : coin.logo_url || getDummySvg(coin.symbol)
                              }
                              alt={coin.symbol}
                              className="w-4 h-4 object-contain rounded-full"
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                if (!failedLogos.has(coin.symbol)) {
                                  console.log(`🔧 Dropdown: Switching to dummy SVG for ${coin.symbol}`);
                                  setFailedLogos(prev => new Set([...prev, coin.symbol]));
                                  target.src = getDummySvg(coin.symbol);
                                }
                              }}
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{coin.symbol}</div>
                            <div className="text-xs text-muted-foreground">{coin.display_name || coin.symbol.replace('USDT', '')}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                    {activeCoins.length > 50 && (
                      <div className="p-2 text-xs text-muted-foreground text-center border-t">
                        İlk 50 coin gösteriliyor. Daha fazla için arama kullanın.
                      </div>
                    )}
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
                                      const symbol = coin?.symbol || 'UNKNOWN';
                                      console.error(`❌ Logo failed: ${symbol} - ${coin?.logo_url}`);
                                      setFailedLogos(prev => new Set([...prev, symbol]));
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
                                {prices.has(alarm.coin_symbol) && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span className="text-slate-600 dark:text-slate-400">
                                      ${prices.get(alarm.coin_symbol)?.price.toFixed(2)}
                                    </span>
                                    {prices.get(alarm.coin_symbol)?.change24h && (
                                      <span className={`text-xs ${
                                        (prices.get(alarm.coin_symbol)?.change24h || 0) >= 0 
                                          ? 'text-green-600 dark:text-green-400' 
                                          : 'text-red-600 dark:text-red-400'
                                      }`}>
                                        {(prices.get(alarm.coin_symbol)?.change24h || 0) >= 0 ? '+' : ''}
                                        {prices.get(alarm.coin_symbol)?.change24h?.toFixed(2)}%
                                      </span>
                                    )}
                                  </div>
                                )}
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

            {/* Live Price Monitor - CoinMarketCap Style */}
            <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Anlık Fiyat Takibi</CardTitle>
                    <CardDescription className="text-sm">
                      Sistem coinlerinin güncel fiyat bilgileri (15 saniyede bir güncellenir)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {prices.size === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Fiyat verileri yükleniyor...</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Binance API&apos;sından anlık veriler alınıyor</p>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <div className="col-span-1 text-center">#</div>
                      <div className="col-span-4">Coin</div>
                      <div className="col-span-2 text-right">Fiyat</div>
                      <div className="col-span-2 text-right">24s Değişim</div>
                      <div className="col-span-3 text-right">Son Güncelleme</div>
                    </div>
                    
                    {/* Table Rows - Optimized */}
                    <div className="max-h-96 overflow-y-auto">
                      {prices.size === 0 ? (
                        <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                          <div className="animate-pulse">Fiyat verileri yükleniyor...</div>
                        </div>
                      ) : (
                        Array.from(prices.entries())
                          .sort(([a], [b]) => a.localeCompare(b))
                          .slice(0, 30) // Reduced to 30 for better performance
                          .map(([symbol, priceData]) => {
                          const coin = coins.find(c => c.symbol === symbol)
                        
                          return (
                            <PriceTableRow
                              key={`price-row-${symbol}`}
                              coin={coin}
                              symbol={symbol}
                              priceData={priceData}
                              failedLogos={failedLogos}
                              setFailedLogos={setFailedLogos}
                              onAlarmCreate={createAlarm}
                              getDummySvg={getDummySvg}
                              shouldUseDummySvg={shouldUseDummySvg}
                            />
                        )
                        })
                      )}
                      
                      {/* Show remaining count */}
                      {prices.size > 50 && (
                        <div className="p-4 text-center border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                          İlk 50 coin gösteriliyor (Toplam: {prices.size} coin)
                        </div>
                      )}
                    </div>
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
                                      const symbol = coin?.symbol || 'UNKNOWN';
                                      console.error(`❌ Logo failed: ${symbol} - ${coin?.logo_url}`);
                                      setFailedLogos(prev => new Set([...prev, symbol]));
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
})

CustomerDashboard.displayName = 'CustomerDashboard'

export default CustomerDashboard
