import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: coins, error } = await supabase
      .from('coins')
      .select('id, symbol, display_name, exchange, active')
      .eq('active', true)
      .order('symbol', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ ok: false, error: 'database_error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, coins })
  } catch (e) {
    console.error('API error:', e)
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 })
  }
}
