import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'UT Bot Configuration - AvoAlert Admin',
  description: 'Configure UT Bot parameters for different coin-timeframe combinations',
}

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Cog, Target, TrendingUp, AlertCircle, Save, Plus, Edit3 } from 'lucide-react'

export default function ConfigPage() {
  const [configs, setConfigs] = useState([
    { id: '1', symbol: 'BTCUSDT', timeframe: '1h', keyValue: 2, atrPeriod: 18, active: true },
    { id: '2', symbol: 'ETHUSDT', timeframe: '4h', keyValue: 1.5, atrPeriod: 14, active: true },
    { id: '3', symbol: 'AVAXUSDT', timeframe: '15m', keyValue: 2.5, atrPeriod: 20, active: false },
  ])
  
  const [newConfig, setNewConfig] = useState({
    symbol: '',
    timeframe: '1h',
    keyValue: 2,
    atrPeriod: 18
  })
  
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleSave = () => {
    if (editingId) {
      setConfigs(configs.map(c => 
        c.id === editingId 
          ? { ...c, ...newConfig }
          : c
      ))
      setEditingId(null)
    } else {
      const id = Math.random().toString(36).substr(2, 9)
      setConfigs([...configs, { ...newConfig, id, active: true }])
    }
    setNewConfig({ symbol: '', timeframe: '1h', keyValue: 2, atrPeriod: 18 })
  }

  const handleEdit = (config: any) => {
    setNewConfig({
      symbol: config.symbol,
      timeframe: config.timeframe,
      keyValue: config.keyValue,
      atrPeriod: config.atrPeriod
    })
    setEditingId(config.id)
  }

  const handleToggleActive = (id: string) => {
    setConfigs(configs.map(c => 
      c.id === id ? { ...c, active: !c.active } : c
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Settings className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-white">UT Bot Configuration</h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Trading parametrelerini yönetin</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-2 bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950 dark:border-orange-800 dark:text-orange-400">
                <Target className="h-4 w-4 mr-2" />
                Aktif Config: {configs.filter(c => c.active).length}
              </Badge>
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
                  <p className="text-blue-100 text-sm font-medium">Toplam Config</p>
                  <p className="text-3xl font-bold">{configs.length}</p>
                </div>
                <Cog className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Aktif Config</p>
                  <p className="text-3xl font-bold">{configs.filter(c => c.active).length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Unique Symbols</p>
                  <p className="text-3xl font-bold">{new Set(configs.map(c => c.symbol)).size}</p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Form */}
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Plus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {editingId ? 'Configuration Düzenle' : 'Yeni Configuration'}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    UT Bot parametrelerini symbol ve timeframe bazında ayarlayın
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="symbol" className="text-sm font-semibold">Symbol</Label>
                  <Input 
                    id="symbol"
                    placeholder="BTCUSDT" 
                    value={newConfig.symbol}
                    onChange={e => setNewConfig({...newConfig, symbol: e.target.value.toUpperCase()})}
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timeframe" className="text-sm font-semibold">Timeframe</Label>
                  <select 
                    id="timeframe"
                    className="w-full h-12 border border-input bg-background px-3 py-2 text-sm ring-offset-background rounded-md"
                    value={newConfig.timeframe}
                    onChange={e => setNewConfig({...newConfig, timeframe: e.target.value})}
                  >
                    <option value="1m">1 Dakika</option>
                    <option value="5m">5 Dakika</option>
                    <option value="15m">15 Dakika</option>
                    <option value="1h">1 Saat</option>
                    <option value="4h">4 Saat</option>
                    <option value="1d">1 Gün</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="keyValue" className="text-sm font-semibold">Key Value (Sensitivity)</Label>
                  <Input 
                    id="keyValue"
                    type="number" 
                    step="0.1"
                    placeholder="2.0" 
                    value={newConfig.keyValue}
                    onChange={e => setNewConfig({...newConfig, keyValue: parseFloat(e.target.value) || 0})}
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="atrPeriod" className="text-sm font-semibold">ATR Period</Label>
                  <Input 
                    id="atrPeriod"
                    type="number" 
                    placeholder="18" 
                    value={newConfig.atrPeriod}
                    onChange={e => setNewConfig({...newConfig, atrPeriod: parseInt(e.target.value) || 0})}
                    className="h-12"
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Parameter Açıklamaları</p>
                    <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                      <li>• <strong>Key Value:</strong> UT Bot hassasiyeti (düşük = daha hassas)</li>
                      <li>• <strong>ATR Period:</strong> Average True Range hesaplama periyodu</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleSave}
                  disabled={!newConfig.symbol || !newConfig.keyValue || !newConfig.atrPeriod}
                  className="flex-1 h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </Button>
                
                {editingId && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditingId(null)
                      setNewConfig({ symbol: '', timeframe: '1h', keyValue: 2, atrPeriod: 18 })
                    }}
                    className="h-12"
                  >
                    İptal
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Configuration List */}
          <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Cog className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">Mevcut Configurationlar</CardTitle>
                  <CardDescription className="text-sm">
                    Symbol ve timeframe bazında tanımlı parametreler
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {configs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Cog className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Henüz configuration yok</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Soldaki formdan yeni configuration ekleyebilirsiniz</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                  {configs.map((config) => (
                    <div
                      key={config.id}
                      className={`p-4 rounded-xl border transition-all duration-200 ${
                        config.active 
                          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800'
                          : 'bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800 dark:to-gray-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {config.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{config.symbol}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">{config.timeframe}</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={config.active ? "default" : "secondary"} className="text-xs">
                            {config.active ? "Aktif" : "Pasif"}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(config)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Key Value:</span>
                          <span className="ml-2 font-mono font-semibold text-slate-900 dark:text-white">{config.keyValue}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">ATR Period:</span>
                          <span className="ml-2 font-mono font-semibold text-slate-900 dark:text-white">{config.atrPeriod}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleActive(config.id)}
                          className={`text-xs ${
                            config.active 
                              ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950'
                              : 'border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-950'
                          }`}
                        >
                          {config.active ? 'Deaktif Et' : 'Aktif Et'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}