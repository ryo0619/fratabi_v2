import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function createSupabaseServer(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
    db: { schema: 'fratabi' },
  });
  return supabase;
}

export async function getUser() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error) return { user: null, error };
  return { user: data.user, error: null };
}

/** Service Role（RLSバイパス用：サーバ限定） */
export function createSupabaseService(): SupabaseClient {
  const { SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_URL } = process.env;
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required on server.');
  }
  const { createClient } = require('@supabase/supabase-js');
  return createClient(NEXT_PUBLIC_SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'fratabi' },
  });
}
