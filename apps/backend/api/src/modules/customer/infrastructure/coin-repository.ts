import { supabaseAdmin } from '../../../infrastructure/supabase/client'
import { Coin } from '../../../shared/domain/entities'
import { CoinRepository } from '../application/ports'

export class SupabaseCoinRepository implements CoinRepository {
  async findBySymbol(symbol: string): Promise<Coin | null> {
    const { data, error } = await supabaseAdmin
      .from('coins')
      .select('*')
      .eq('symbol', symbol)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Database error: ${error.message}`)
    }

    return data || null
  }

  async findActive(): Promise<Coin[]> {
    const { data, error } = await supabaseAdmin
      .from('coins')
      .select('*')
      .eq('active', true)
      .order('display_name', { ascending: true })

    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }

    return data || []
  }
}