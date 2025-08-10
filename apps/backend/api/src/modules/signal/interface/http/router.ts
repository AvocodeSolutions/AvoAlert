import { Router } from 'express'
import { IngestSignalUseCase } from '../../application/usecases/ingest-signal'

export const signalRouter = Router()

signalRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'signal' })
})

signalRouter.post('/ingest', async (req, res) => {
  const uc = new IngestSignalUseCase()
  try {
    const signal = await uc.execute(req.body)
    res.status(201).json({ ok: true, signal })
  } catch (err) {
    res.status(400).json({ ok: false, error: (err as Error).message })
  }
})

