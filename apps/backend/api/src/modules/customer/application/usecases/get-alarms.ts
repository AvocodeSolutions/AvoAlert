import { UserAlarm } from '../../../../shared/domain/entities'
import { GetAlarmsRequest } from '../../../../shared/dto/customer.dto'
import { AlarmRepository, GetAlarmsUseCase } from '../ports'

export class GetAlarmsUseCaseImpl implements GetAlarmsUseCase {
  constructor(private alarmRepo: AlarmRepository) {}

  async execute(request: GetAlarmsRequest): Promise<UserAlarm[]> {
    return await this.alarmRepo.findByEmail(request.email)
  }
}