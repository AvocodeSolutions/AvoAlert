import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'


const createAlarmSchema = z.object({
  email: z.string().email(),
  coin_symbol: z.string().min(1),
  timeframe: z.string().min(1),
  action: z.enum(['buy', 'sell'])
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const email = searchParams.get('email')

    if (!email) {
      return NextResponse.json({ ok: false, error: 'email_required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: alarms, error } = await supabase
      .from('user_alarms')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ ok: false, error: 'database_error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, alarms })
  } catch (e) {
    console.error('API error:', e)
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createAlarmSchema.parse(body)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if alarm already exists
    const { data: existing } = await supabase
      .from('user_alarms')
      .select('id')
      .eq('email', parsed.email)
      .eq('coin_symbol', parsed.coin_symbol)
      .eq('timeframe', parsed.timeframe)
      .eq('action', parsed.action)
      .eq('is_active', true)
      .single()

    if (existing) {
      return NextResponse.json({ 
        ok: false, 
        error: 'alarm_exists',
        message: 'Bu coin için zaten aktif alarm var!' 
      }, { status: 400 })
    }

    // Verify coin exists
    const { data: coin } = await supabase
      .from('coins')
      .select('symbol')
      .eq('symbol', parsed.coin_symbol)
      .eq('active', true)
      .single()

    if (!coin) {
      return NextResponse.json({ 
        ok: false, 
        error: 'coin_not_found',
        message: 'Geçersiz coin!' 
      }, { status: 400 })
    }

    // Create alarm
    const { data: alarm, error } = await supabase
      .from('user_alarms')
      .insert([{
        email: parsed.email,
        coin_symbol: parsed.coin_symbol,
        timeframe: parsed.timeframe,
        action: parsed.action,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ ok: false, error: 'database_error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, alarm }, { status: 201 })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ ok: false, error: 'validation_error', details: e.errors }, { status: 400 })
    }
    console.error('API error:', e)
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500 })
  }
}
