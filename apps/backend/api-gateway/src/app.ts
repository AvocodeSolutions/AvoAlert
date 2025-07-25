import express from 'express'

const app = express()
const PORT = process.env.PORT || 3003

// Middleware
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' })
})

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'API Gateway Service is running' })
})

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`)
})