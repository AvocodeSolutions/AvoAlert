import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">AvoAlert</span>
            <span className="block text-indigo-600">Crypto Signal Platform</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Get real-time crypto trading signals based on UT Bot indicator via email, SMS, and web push notifications.
          </p>
          
          {/* Shadcn/ui Badge Examples */}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Badge variant="default">UT Bot Signals</Badge>
            <Badge variant="secondary">Real-time</Badge>
            <Badge variant="destructive">High Volatility</Badge>
            <Badge variant="outline">Email & SMS</Badge>
          </div>
          
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              ✓ Active Signals
            </Badge>
            <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
              📊 Analytics
            </Badge>
            <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
              🔔 Push Notifications
            </Badge>
          </div>
          <div className="mt-5 max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3 md:mt-8">
            <Button asChild size="lg" className="w-full">
              <a href="/admin/monitoring">Monitoring Panel</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <a href="/admin/test-panel">TradingView Webhook</a>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <a href="/admin/alerts">Admin Alerts & Scripts</a>
            </Button>
          </div>
        </div>
        
        {/* Features Section with Shadcn Cards */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Platform Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📈 UT Bot Signals
                  <Badge variant="secondary">Live</Badge>
                </CardTitle>
                <CardDescription>
                  Advanced UT Bot indicator-based trading signals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Get precise buy/sell signals based on proven UT Bot algorithm with customizable parameters.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔔 Multi-Channel Alerts
                  <Badge variant="outline">3 Channels</Badge>
                </CardTitle>
                <CardDescription>
                  Email, SMS, and web push notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Never miss a trading opportunity with instant notifications across all your devices.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚡ Real-time Processing
                  <Badge className="bg-green-100 text-green-800">Fast</Badge>
                </CardTitle>
                <CardDescription>
                  Sub-5 second signal delivery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Lightning-fast signal processing ensures you act on opportunities before they disappear.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* API Endpoints Quick Links */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">API Uç Noktaları</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: 'Health', method: 'GET', path: '/health', desc: 'API sağlık kontrolü' },
              { title: 'Processed Signals', method: 'GET', path: '/signals/processed', desc: 'Son işlenen sinyaller' },
              { title: 'Queue Stats', method: 'GET', path: '/admin/queue-stats', desc: 'Kuyruk istatistikleri' },
              { title: 'Queue Peek', method: 'GET', path: '/admin/queue-peek?limit=20', desc: 'Kuyruğun son N öğesi' },
              { title: 'Notifications', method: 'GET', path: '/admin/notifications', desc: 'Teslimat kayıtları' },
              { title: 'Webhook Info', method: 'GET', path: '/admin/webhook', desc: 'Webhook URL ve secret' },
              { title: 'Presets', method: 'GET', path: '/admin/presets', desc: 'Preset listesi' },
              { title: 'Indicators', method: 'GET', path: '/admin/indicators', desc: 'Indicator listesi' },
              { title: 'Coin Groups', method: 'GET', path: '/admin/groups', desc: 'Coin grupları' },
              { title: 'Timeframe Sets', method: 'GET', path: '/admin/timeframes', desc: 'TF setleri' },
              { title: 'Assignments', method: 'GET', path: '/admin/assignments', desc: 'Atamalar' },
              { title: 'Export Tasklist', method: 'GET', path: '/admin/export-tasklist', desc: 'TV görev listesi' },
              { title: 'Coins', method: 'GET', path: '/admin/coins', desc: 'Coin listesi' },
              { title: 'TF Master', method: 'GET', path: '/admin/tf-master', desc: 'Timeframe master' },
            ].map((ep) => (
              <Card key={ep.path}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{ep.title}</span>
                    <Badge variant="outline">{ep.method}</Badge>
                  </CardTitle>
                  <CardDescription>{ep.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xs text-gray-600 break-all">{API_BASE}{ep.path}</div>
                  <div className="mt-3">
                    <Button asChild size="sm" variant="outline">
                      <a href={`${API_BASE}${ep.path}`} target="_blank" rel="noreferrer">Aç</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-3">Not: POST uçları için panel içi butonları veya cURL kullanın.</p>
        </div>
      </div>
    </div>
  )
}