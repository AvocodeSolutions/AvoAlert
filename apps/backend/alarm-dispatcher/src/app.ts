import express from 'express'

const app = express()
const PORT = process.env.PORT || 3002

// Middleware
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'alarm-dispatcher' })
})

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Alarm Dispatcher Service is running' })
})

app.listen(PORT, () => {
  console.log(`Alarm Dispatcher running on port ${PORT}`)
})