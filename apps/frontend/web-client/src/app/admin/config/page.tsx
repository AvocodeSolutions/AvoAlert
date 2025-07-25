import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'UT Bot Configuration - AvoAlert Admin',
  description: 'Configure UT Bot parameters for different coin-timeframe combinations',
}

export default function ConfigPage() {
  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">UT Bot Configuration</h1>
          <p className="mt-2 text-gray-600">
            Manage UT Bot parameters for different coin-timeframe combinations
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <p className="text-gray-500">
            UT Bot configuration interface will be implemented here
          </p>
        </div>
      </div>
    </div>
  )
}