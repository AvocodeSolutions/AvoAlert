import express from 'express'
import { loadEnv } from './shared/load-env'
loadEnv()
import cors from 'cors'
import { signalRouter } from './modules/signal'
import { notificationRouter } from './modules/notification'
import { billingRouter } from './modules/billing'
import { adminRouter } from './modules/admin'
import { CustomerRouter } from './modules/customer'
import { createPricesModule } from './modules/prices'
import { redis } from './infrastructure/queue/upstash'
import { supabaseAdmin } from './infrastructure/supabase/client'

const app = express()
const PORT = process.env.PORT || 4000

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000',  // Local development (Next.js default)
    'http://localhost:3001',  // Local development (alternative port)
    'https://avoalert.vercel.app',  // Production frontend
    'https://avoalert-*.vercel.app',  // Vercel preview deployments
    'https://avoalert-app.onrender.com',  // Render static site
    'https://avoalert.com',  // Custom domain
    'https://www.avoalert.com'  // Custom domain with www
  ],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
}
app.use(cors(corsOptions))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api', architecture: 'modular-monolith' })
})

// Initialize Prices Module with database symbols
console.log('🔧 Initializing prices module...')

async function initializePricesModule() {
  // Get all active coins from database for WebSocket stream
  let defaultSymbols: string[] = []
  try {
    const { data: coins } = await supabaseAdmin
      .from('coins')
      .select('symbol')
      .eq('active', true)
    
    defaultSymbols = coins?.map(coin => coin.symbol) || []
    console.log(`📊 Found ${defaultSymbols.length} active coins for WebSocket stream`)
  } catch (error) {
    console.error('Failed to fetch coins, using fallback symbols:', error)
    defaultSymbols = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 
      'DOGEUSDT', 'MATICUSDT', 'SOLUSDT', 'LTCUSDT', 'AVAXUSDT'
    ]
  }

  const pricesModule = createPricesModule({
    redisClient: redis,
    enableStream: process.env.ENABLE_PRICE_STREAM !== 'false',
    defaultSymbols
  })
  
  app.use('/prices', pricesModule.router)
  console.log(`✅ Prices module initialized with ${defaultSymbols.length} symbols`)
}

// Initialize prices module asynchronously
initializePricesModule().catch(error => {
  console.error('Failed to initialize prices module:', error)
})

app.use('/signals', signalRouter)
app.use('/notifications', notificationRouter)
app.use('/billing', billingRouter)
app.use('/admin', adminRouter)
app.use('/customer', CustomerRouter)

app.get('/', (req, res) => {
  res.json({ message: 'AvoAlert API is running' })
})

// Minimal test panel to visualize processed signals
app.get('/panel', async (req, res) => {
  try {
    const html = `<!doctype html>
    <html><head><meta charset="utf-8"><title>AvoAlert Panel</title>
    <style>body{font-family:Arial;margin:24px} pre{background:#f5f5f5;padding:12px;border-radius:8px}</style>
    </head><body>
      <h1>AvoAlert Test Panel</h1>
      <p>
        <strong>Webhook:</strong> POST <code>/signals/tradingview</code><br/>
        <strong>Processed feed:</strong> <a href="/signals/processed" target="_blank">/signals/processed</a>
      </p>
      <p>Use the simulator: <code>npm run simulate</code> in <em>apps/backend/api</em>.</p>
      <p>Then refresh <em>/signals/processed</em> or this page.</p>
      <script>setTimeout(()=>location.reload(), 5000)</script>
    </body></html>`
    res.setHeader('content-type', 'text/html').send(html)
  } catch {
    res.status(500).send('panel error')
  }
})

// Start workers if enabled (for free tier deployment)
if (process.env.START_WORKERS === 'true') {
  console.log('Starting integrated workers...')
  console.log('Environment check - START_WORKERS:', process.env.START_WORKERS)
  console.log('Environment check - UPSTASH_REDIS_URL exists:', !!process.env.UPSTASH_REDIS_URL)
  
  // Import and start signal worker
  import('./workers/signal-consumer').then(module => {
    console.log('Signal worker started successfully')
  }).catch(err => {
    console.error('Failed to start signal worker:', err)
  })
  
  // Import and start notification worker
  import('./workers/notification-worker').then(module => {
    console.log('Notification worker started successfully')
  }).catch(err => {
    console.error('Failed to start notification worker:', err)
  })
} else {
  console.log('Workers not enabled - START_WORKERS:', process.env.START_WORKERS)
}

app.listen(PORT, () => {
  console.log(`AvoAlert API running on port ${PORT}`)
  if (process.env.START_WORKERS === 'true') {
    console.log('Workers are integrated into this process')
  }
})

