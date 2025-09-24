import { NextResponse } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/';

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', request.url));
  }

  // Route Handler なので cookie 書き込み可のクライアントを使う
  const supabase = await createSupabaseRoute();

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL('/auth/login?error=exchange_failed', request.url));
  }

  // users を upsert（plan 既定: free）
  const u = data.user;
  await supabase.from('users').upsert(
    {
      id: u.id,
      email: u.email,
      display_name: u.user_metadata?.name ?? '',
      plan: 'free',
    },
    { onConflict: 'id' }
  );

  return NextResponse.redirect(new URL(next, request.url));
}
