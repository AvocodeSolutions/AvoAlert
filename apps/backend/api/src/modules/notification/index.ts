import { Router } from 'express'

export const notificationRouter = Router()

notificationRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'notification' })
})

