import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export function createSupabaseBrowser(): SupabaseClient<Database, 'fratabi'> {
  return createBrowserClient<Database, 'fratabi'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'fratabi' } }
  )
}
