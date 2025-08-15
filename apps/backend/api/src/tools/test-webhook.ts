import { loadEnv } from '../shared/load-env'
loadEnv()

async function testWebhook() {
  console.log('🔥 WEBHOOK TEST BAŞLIYOR...')
  
  const payload = {
    symbol: 'ADAUSDT',
    timeframe: '15m',
    action: 'sell', // ← SELL gönderiyoruz!
    timestamp: new Date().toISOString(),
    secret: process.env.TRADINGVIEW_WEBHOOK_SECRET || 'test-secret',
    source: 'test'
  }
  
  console.log('📤 GÖNDERILEN PAYLOAD:', payload)
  
  try {
    const response = await fetch('http://localhost:4000/signals/tradingview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    const result = await response.json()
    console.log('📥 WEBHOOK YANITI:', result)
    
    if (result.action === 'sell') {
      console.log('✅ BAŞARILI: SELL sinyali doğru algılandı!')
    } else {
      console.log('❌ PROBLEM: SELL gönderildi ama', result.action, 'algılandı!')
    }
    
  } catch (error) {
    console.error('💥 HATA:', error)
  }
}

testWebhook()
