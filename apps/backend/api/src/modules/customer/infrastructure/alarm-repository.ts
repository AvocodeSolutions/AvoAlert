import { supabaseAdmin } from '../../../infrastructure/supabase/client'
import { UserAlarm } from '../../../shared/domain/entities'
import { CreateAlarmRequest } from '../../../shared/dto/customer.dto'
import { AlarmRepository } from '../application/ports'

export class SupabaseAlarmRepository implements AlarmRepository {
  async findByEmail(email: string): Promise<UserAlarm[]> {
    const { data, error } = await supabaseAdmin
      .from('user_alarms')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data || []
  }

  async findDuplicate(request: CreateAlarmRequest): Promise<UserAlarm | null> {
    const { data, error } = await supabaseAdmin
      .from('user_alarms')
      .select('*')
      .eq('email', request.email)
      .eq('coin_symbol', request.coin_symbol)
      .eq('timeframe', request.timeframe)
      .eq('action', request.action)
      .eq('is_active', true)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Database error: ${error.message}`)
    }

    return data || null
  }

  async create(request: CreateAlarmRequest): Promise<UserAlarm> {
    const { data, error } = await supabaseAdmin
      .from('user_alarms')
      .insert([{
        email: request.email,
        coin_symbol: request.coin_symbol,
        timeframe: request.timeframe,
        action: request.action,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data
  }

  async update(id: number, data: Partial<UserAlarm>): Promise<UserAlarm> {
    const { data: result, error } = await supabaseAdmin
      .from('user_alarms')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return result
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_alarms')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
  }
}