import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseAdmin: SupabaseClient | null = null

// Admin client (service role) — bypasses RLS, server-side only
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!_supabaseAdmin) {
      _supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    }
    const value = (_supabaseAdmin as unknown as Record<string | symbol, unknown>)[prop]
    return typeof value === 'function' ? value.bind(_supabaseAdmin) : value
  },
})
