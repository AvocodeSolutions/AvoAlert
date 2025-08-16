import express from 'express'
import { loadEnv } from './shared/load-env'
loadEnv()
import cors from 'cors'
import { signalRouter } from './modules/signal'
import { notificationRouter } from './modules/notification'
import { billingRouter } from './modules/billing'
import { adminRouter } from './modules/admin'
import { CustomerRouter } from './modules/customer'

const app = express()
const PORT = process.env.PORT || 4000

// CORS configuration for production
const corsOptions = {
  origin: [
    'http://localhost:3000',  // Local development (Next.js default)
    'http://localhost:3001',  // Local development (alternative port)
    'https://avoalert.vercel.app',  // Production frontend
    'https://avoalert-*.vercel.app'  // Vercel preview deployments
  ],
  credentials: true
}
app.use(cors(corsOptions))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api', architecture: 'modular-monolith' })
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

app.listen(PORT, () => {
  console.log(`AvoAlert API running on port ${PORT}`)
})

