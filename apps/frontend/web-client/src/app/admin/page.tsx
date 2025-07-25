import { Metadata } from 'next'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
    title: 'Admin Dashboard - AvoAlert',
    description: 'Admin panel for managing UT Bot configurations and monitoring system',
}

export default function AdminPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Admin Dashboard
                        </h1>
                        <div className="flex gap-2">
                            <Badge variant="default">System Online</Badge>
                            <Badge variant="secondary">v1.0.0</Badge>
                            <Badge className="bg-green-100 text-green-800">All Services Running</Badge>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    UT Bot Configs
                                    <Badge variant="outline">12 Active</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Manage trading signal configurations
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full">
                                    <a href="/admin/config">Manage Configs</a>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    System Monitor
                                    <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Real-time system metrics and alerts
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild variant="outline" className="w-full">
                                    <a href="/admin/monitoring">View Metrics</a>
                                </Button>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    Queue Status
                                    <Badge variant="secondary">Processing</Badge>
                                </CardTitle>
                                <CardDescription>
                                    Signal processing queue health
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Pending Jobs:</span>
                                        <Badge variant="outline">23</Badge>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Processed Today:</span>
                                        <Badge className="bg-blue-100 text-blue-800">1,247</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}