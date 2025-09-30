import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/lib/database.types';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  // リダイレクト用レスポンスを先に作成し、そこへCookieを書き込む
  const redirectResponse = NextResponse.redirect(`${origin}/`);

  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database, 'fratabi'>(supabaseUrl, anonKey, {
    db: { schema: 'fratabi' },
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => redirectResponse.cookies.set({ name, value, ...options }),
      remove: (name, options) => redirectResponse.cookies.set({ name, value: '', ...options }),
    },
  });

  // 1) セッション確立（Set-Cookie を redirectResponse に付与）
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data?.session?.user) {
    return NextResponse.redirect(`${origin}/auth/login?error=exchange_failed`);
  }
  const user = data.session.user;

  // 2) users 行の存在保証（RLS: id = auth.uid() を許可している前提）
  const db = supabase as any;
  const up = await db.from('users').upsert({ id: user.id }, { onConflict: 'id' });
  if (up.error) {
    console.error('[callback] users upsert error:', up.error);
  }

  // 3) ホームへ（Set-Cookie付きのレスポンスを返す）
  return redirectResponse;
}
