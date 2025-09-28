import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types'

// "fratabi" スキーマで型付け
//type Supa = SupabaseClient<unknown, 'fratabi'>;
type Supa = SupabaseClient<Database, 'fratabi'>

function makeClient(
  url: string,
  key: string,
  cookieImpl: {
    get: (n: string) => string | undefined;
    set?: (n: string, v: string, o: CookieOptions) => void;
    remove?: (n: string, o: CookieOptions) => void;
  }
): Supa {
  // 第二ジェネリクスに 'fratabi' を指定。db.schema も 'fratabi'
  const client = createServerClient<Database, 'fratabi'>(url, key, {
    cookies: {
      get: cookieImpl.get,
      set: cookieImpl.set ?? (() => {}),       // RSCではno-op
      remove: cookieImpl.remove ?? (() => {}), // RSCではno-op
    },
    db: { schema: 'fratabi' },
    auth: {
      persistSession: false,        // サーバではセッションを保存しない（都度Cookie入力のみ）
      autoRefreshToken: false,      // 自動リフレッシュをサーバでは無効化
      detectSessionInUrl: false,    // リダイレクトURLでの検出はcallbackルートだけでやる
    },
  });
  return client as Supa;
}

/** RSC/Server Component 用（Cookie変更禁止：set/removeはno-op） */
export async function createSupabaseRSC(): Promise<Supa> {
  const store = await cookies(); // ← Promise を await
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return makeClient(url, key, {
    get: (name) => store.get(name)?.value,
  });
}

/** Route Handler / Server Action 用（Cookie変更OK） */
export async function createSupabaseRoute(): Promise<Supa> {
  const store = await cookies(); // Next 15: Promise
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createServerClient<Database, 'fratabi'>(url, key, {
    cookies: {
      get: (name) => store.get(name)?.value,
      set(name, value, options) {
        store.set({ name, value, ...options });
      },
      remove(name, options) {
        store.set({ name, value: '', ...options });
      },
    },
    db: { schema: 'fratabi' },
  });
}

/** RSCから認証状態を読むだけのヘルパ */
export async function getUser() {
  const supabase = await createSupabaseRSC();
  const { data, error } = await supabase.auth.getUser();
  if (error) return { user: null, error };
  return { user: data.user, error: null };
}

/** Service Role（RLSバイパス：サーバ限定） */
export function createSupabaseService(): Supa {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const SERVICE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_KEY ||
    '';

  if (!SERVICE_KEY) {
    throw new Error('SUPABASE service role key is required on server.');
  }

  return createClient<Database, 'fratabi'>(url, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'fratabi' },
  });
}

// 既存参照の後方互換エイリアス
export { createSupabaseRSC as createSupabaseServer };
