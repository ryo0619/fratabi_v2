import { NextResponse } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const origin = url.origin;

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/login?error=missing_code`);
  }

  // 標準ヘルパでCookieを現在のレスポンスに付与させる
  const supabase = await createSupabaseRoute();

  // 1) セッション確立
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

  // 3) スプラッシュへ
  return NextResponse.redirect(`${origin}/splash`);
}
