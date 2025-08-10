import { Router } from 'express'

export const billingRouter = Router()

billingRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'billing' })
})

