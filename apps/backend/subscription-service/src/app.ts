import express from 'express'

const app = express()
const PORT = process.env.PORT || 3004

// Middleware
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'subscription-service' })
})

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Subscription Service is running' })
})

app.listen(PORT, () => {
  console.log(`Subscription Service running on port ${PORT}`)
})