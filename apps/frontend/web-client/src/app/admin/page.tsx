'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Settings, Activity, BarChart3, Users, Zap, TrendingUp, Clock, Database, Target, ArrowRight, ChevronRight } from 'lucide-react'


export default function AdminPage() {
    const [stats, setStats] = useState({
        configs: 12,
        processed: 1247,
        pending: 23,
        users: 45,
        uptime: '99.9%'
    })

    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            {/* Header */}
            <div className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500 rounded-lg">
                                    <Settings className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">AvoAlert Sistem Yönetimi</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                    {currentTime.toLocaleTimeString('tr-TR')}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    {currentTime.toLocaleDateString('tr-TR')}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="default" className="bg-green-500">System Online</Badge>
                                <Badge variant="secondary">v1.0.0</Badge>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto p-6 space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Aktif Configler</p>
                                    <p className="text-3xl font-bold">{stats.configs}</p>
                                    <p className="text-blue-200 text-xs mt-1">UT Bot ayarları</p>
                                </div>
                                <Target className="h-8 w-8 text-blue-200" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Bugün İşlenen</p>
                                    <p className="text-3xl font-bold">{stats.processed.toLocaleString()}</p>
                                    <p className="text-green-200 text-xs mt-1">Sinyal işleme</p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-green-200" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">Bekleyen İşler</p>
                                    <p className="text-3xl font-bold">{stats.pending}</p>
                                    <p className="text-purple-200 text-xs mt-1">Queue durumu</p>
                                </div>
                                <Database className="h-8 w-8 text-purple-200" />
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm font-medium">Sistem Durumu</p>
                                    <p className="text-3xl font-bold">{stats.uptime}</p>
                                    <p className="text-orange-200 text-xs mt-1">Uptime</p>
                                </div>
                                <Activity className="h-8 w-8 text-orange-200" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link href="/admin/config">
                        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 cursor-pointer group">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-800 transition-colors">
                                            <Settings className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">UT Bot Configuration</CardTitle>
                                            <CardDescription className="text-sm">
                                                Trading parametre yönetimi
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="default" className="bg-orange-500">{stats.configs} Aktif</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Symbol ve timeframe bazlı ayarlar</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/monitoring">
                        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 cursor-pointer group">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-800 transition-colors">
                                            <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">System Monitoring</CardTitle>
                                            <CardDescription className="text-sm">
                                                Gerçek zamanlı sistem izleme
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-green-500">Sağlıklı</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Queue, worker ve API durumu</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/alerts">
                        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 cursor-pointer group">
                            <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
                                            <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Alert Management</CardTitle>
                                            <CardDescription className="text-sm">
                                                Preset ve indicator yönetimi
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">Aktif</Badge>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Pine script ve grup yönetimi</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* System Status */}
                <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Sistem Durumu</CardTitle>
                                <CardDescription className="text-sm">
                                    Kritik sistem metrikleri ve sağlık durumu
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">API Server</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Port 4000 - Çalışıyor</p>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Signal Worker</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Queue consumer aktif</p>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Redis Queue</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Upstash bağlantısı OK</p>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-medium">Database</span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Supabase bağlantısı OK</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium">Son Güncelleme</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{currentTime.toLocaleString('tr-TR')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">Sistem Sağlığı</p>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Mükemmel</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}