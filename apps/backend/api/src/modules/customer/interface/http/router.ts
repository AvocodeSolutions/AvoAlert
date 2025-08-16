import { Router } from 'express'
import { CreateAlarmRequestSchema, GetAlarmsRequestSchema } from '../../../../shared/dto/customer.dto'
import { CreateAlarmUseCaseImpl } from '../../application/usecases/create-alarm'
import { GetAlarmsUseCaseImpl } from '../../application/usecases/get-alarms'
import { SupabaseAlarmRepository } from '../../infrastructure/alarm-repository'
import { SupabaseCoinRepository } from '../../infrastructure/coin-repository'

const router = Router()

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', module: 'customer' })
})

// Get coins
router.get('/coins', async (req, res) => {
  try {
    const coinRepo = new SupabaseCoinRepository()
    const coins = await coinRepo.findActive()
    
    const response = coins.map(coin => ({
      id: coin.id,
      symbol: coin.symbol,
      display_name: coin.display_name,
      exchange: coin.exchange,
      active: coin.active
    }))

    res.json({ ok: true, data: response })
  } catch (error) {
    console.error('Get coins error:', error)
    res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// Get user alarms
router.get('/alarms', async (req, res) => {
  try {
    const validation = GetAlarmsRequestSchema.safeParse(req.query)
    if (!validation.success) {
      return res.status(400).json({ 
        ok: false, 
        error: 'validation_error', 
        details: validation.error.issues 
      })
    }

    const alarmRepo = new SupabaseAlarmRepository()
    const getAlarmsUseCase = new GetAlarmsUseCaseImpl(alarmRepo)
    
    const alarms = await getAlarmsUseCase.execute(validation.data)

    const response = alarms.map(alarm => ({
      id: alarm.id,
      email: alarm.email,
      coin_symbol: alarm.coin_symbol,
      timeframe: alarm.timeframe,
      action: alarm.action,
      is_active: alarm.is_active,
      created_at: alarm.created_at
    }))

    res.json({ ok: true, data: response })
  } catch (error) {
    console.error('Get alarms error:', error)
    res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// Create alarm
router.post('/alarms', async (req, res) => {
  try {
    const validation = CreateAlarmRequestSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({ 
        ok: false, 
        error: 'validation_error', 
        details: validation.error.issues 
      })
    }

    const alarmRepo = new SupabaseAlarmRepository()
    const coinRepo = new SupabaseCoinRepository()
    const createAlarmUseCase = new CreateAlarmUseCaseImpl(alarmRepo, coinRepo)

    const alarm = await createAlarmUseCase.execute(validation.data)

    const response = {
      id: alarm.id,
      email: alarm.email,
      coin_symbol: alarm.coin_symbol,
      timeframe: alarm.timeframe,
      action: alarm.action,
      is_active: alarm.is_active,
      created_at: alarm.created_at
    }

    res.status(201).json({ ok: true, data: response })
  } catch (error) {
    console.error('Create alarm error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'COIN_NOT_FOUND') {
        return res.status(400).json({ 
          ok: false, 
          error: 'coin_not_found',
          message: 'Geçersiz coin!' 
        })
      }
      if (error.message === 'ALARM_EXISTS') {
        return res.status(400).json({ 
          ok: false, 
          error: 'alarm_exists',
          message: 'Bu coin için zaten aktif alarm var!' 
        })
      }
    }

    res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// Delete alarm
router.delete('/alarms/:id', async (req, res) => {
  try {
    const alarmId = parseInt(req.params.id)
    if (isNaN(alarmId)) {
      return res.status(400).json({ ok: false, error: 'invalid_id' })
    }

    const alarmRepo = new SupabaseAlarmRepository()
    await alarmRepo.delete(alarmId)

    res.json({ ok: true, message: 'Alarm deleted successfully' })
  } catch (error) {
    console.error('Delete alarm error:', error)
    res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

export { router as CustomerRouter }