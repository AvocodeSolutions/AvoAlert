import { UserAlarm } from '../../../../shared/domain/entities'
import { CreateAlarmRequest } from '../../../../shared/dto/customer.dto'
import { AlarmRepository, CoinRepository, CreateAlarmUseCase } from '../ports'

export class CreateAlarmUseCaseImpl implements CreateAlarmUseCase {
  constructor(
    private alarmRepo: AlarmRepository,
    private coinRepo: CoinRepository
  ) {}

  async execute(request: CreateAlarmRequest): Promise<UserAlarm> {
    // 1. Coin exists and active kontrolü
    const coin = await this.coinRepo.findBySymbol(request.coin_symbol)
    if (!coin || !coin.active) {
      throw new Error('COIN_NOT_FOUND')
    }

    // 2. Duplicate alarm kontrolü
    const existing = await this.alarmRepo.findDuplicate(request)
    if (existing) {
      throw new Error('ALARM_EXISTS')
    }

    // 3. Alarm oluştur
    return await this.alarmRepo.create(request)
  }
}