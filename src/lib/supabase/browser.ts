import { createBrowserClient } from '@supabase/ssr'
// Database 型が無ければ any でOK
export function createSupabaseBrowser() {
  return createBrowserClient<any, 'fratabi'>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'fratabi' } }
  )
}