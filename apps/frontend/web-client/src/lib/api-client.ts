// Backend API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface ApiResponse<T = any> {
  ok: boolean
  data?: T
  error?: string
  message?: string
  details?: any
}

// Base fetch wrapper with error handling
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    const data = await response.json()
    
    if (!response.ok) {
      return {
        ok: false,
        error: data.error || 'API_ERROR',
        message: data.message,
        details: data.details
      }
    }

    return data
  } catch (error) {
    console.error('API request failed:', error)
    return {
      ok: false,
      error: 'NETWORK_ERROR',
      message: 'Network request failed'
    }
  }
}

// Customer API calls
export const customerApi = {
  // Get active coins
  getCoins: () => apiRequest<any[]>('/customer/coins'),

  // Get user alarms
  getAlarms: (email: string) => 
    apiRequest<any[]>(`/customer/alarms?email=${encodeURIComponent(email)}`),

  // Create alarm
  createAlarm: (data: {
    email: string
    coin_symbol: string
    timeframe: string
    action: 'buy' | 'sell'
  }) => apiRequest('/customer/alarms', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Delete alarm
  deleteAlarm: (alarmId: number) => 
    apiRequest(`/customer/alarms/${alarmId}`, { method: 'DELETE' })
}

// Admin API calls
export const adminApi = {
  // Queue monitoring
  getQueueStats: () => apiRequest('/admin/queue-stats'),
  getEnqueued: () => apiRequest('/admin/enqueued'),
  getProcessed: () => apiRequest('/signals/processed'),

  // Notifications
  getNotifications: () => apiRequest('/admin/notifications'),
  clearNotifications: () => apiRequest('/admin/clear-notifications', { method: 'POST' }),
  
  // CRUD endpoints for admin panel
  getPresets: () => apiRequest('/admin/presets'),
  createPreset: (data: any) => apiRequest('/admin/presets', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  getGroups: () => apiRequest('/admin/groups'),
  getTimeframes: () => apiRequest('/admin/timeframes'),
  getAssignments: () => apiRequest('/admin/assignments'),
  getIndicators: () => apiRequest('/admin/indicators'),
  getCoins: () => apiRequest('/admin/coins'),
}

// Signal API calls
export const signalApi = {
  // Send test signal
  sendTestSignal: (data: {
    symbol: string
    timeframe: string
    action: 'buy' | 'sell'
    price?: number
    timestamp?: string
  }) => apiRequest('/signals/ingest', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
      price: data.price || 50000
    })
  }),

  // Get processed signals
  getProcessed: () => apiRequest('/signals/processed')
}

// Health check
export const healthApi = {
  checkApi: () => apiRequest('/health'),
  checkCustomer: () => apiRequest('/customer/health'),
  checkSignal: () => apiRequest('/signals/health'),
  checkNotification: () => apiRequest('/notifications/health'),
}