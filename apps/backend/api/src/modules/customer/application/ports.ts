import { UserAlarm, Coin } from '../../../shared/domain/entities'
import { CreateAlarmRequest, GetAlarmsRequest } from '../../../shared/dto/customer.dto'

// Repository interfaces
export interface AlarmRepository {
  findByEmail(email: string): Promise<UserAlarm[]>
  findDuplicate(request: CreateAlarmRequest): Promise<UserAlarm | null>
  create(request: CreateAlarmRequest): Promise<UserAlarm>
  update(id: number, data: Partial<UserAlarm>): Promise<UserAlarm>
  delete(id: number): Promise<void>
}

export interface CoinRepository {
  findBySymbol(symbol: string): Promise<Coin | null>
  findActive(): Promise<Coin[]>
}

// Use case interfaces
export interface CreateAlarmUseCase {
  execute(request: CreateAlarmRequest): Promise<UserAlarm>
}

export interface GetAlarmsUseCase {
  execute(request: GetAlarmsRequest): Promise<UserAlarm[]>
}