import express from 'express'
import { signalRouter } from './modules/signal'
import { notificationRouter } from './modules/notification'
import { billingRouter } from './modules/billing'

const app = express()
const PORT = process.env.PORT || 4000

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api', architecture: 'modular-monolith' })
})

app.use('/signals', signalRouter)
app.use('/notifications', notificationRouter)
app.use('/billing', billingRouter)

app.get('/', (req, res) => {
  res.json({ message: 'AvoAlert API is running' })
})

app.listen(PORT, () => {
  console.log(`AvoAlert API running on port ${PORT}`)
})

