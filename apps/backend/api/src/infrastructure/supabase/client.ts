import { createClient } from '@supabase/supabase-js'
// loadEnv() is called in src/app.ts entry point

let supabaseInstance: any = null

function createSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  const SUPABASE_URL = process.env.SUPABASE_URL as string
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase env vars missing')
  }

  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  
  return supabaseInstance
}

// Lazy getter for supabaseAdmin
export const supabaseAdmin = new Proxy({} as any, {
  get(target, prop) {
    const client = createSupabaseClient()
    return client[prop]
  }
})


