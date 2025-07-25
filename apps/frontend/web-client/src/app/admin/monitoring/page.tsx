import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'System Monitoring - AvoAlert Admin',
  description: 'Monitor system performance, queue status, and analytics',
}

export default function MonitoringPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">System Monitoring</h1>
          <p className="mt-2 text-gray-600">
            Real-time system metrics, queue status, and performance analytics
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Queue Status</h3>
            <p className="text-gray-500">Queue monitoring will be here</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">System Metrics</h3>
            <p className="text-gray-500">Performance metrics will be here</p>
          </div>
          
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">User Analytics</h3>
            <p className="text-gray-500">User activity analytics will be here</p>
          </div>
        </div>
      </div>
    </div>
  )
}