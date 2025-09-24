import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

function verifyToken(token: string) {
  const secret = process.env.INVITE_TOKEN_SECRET!;
  const [p, sig] = token.split('.');
  if (!p || !sig) return null;
  const expSig = crypto.createHmac('sha256', secret).update(p).digest('base64url');
  if (expSig !== sig) return null;
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  return payload;
}

export async function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get('t');
  if (!t) return NextResponse.json({ error: 'INVITE_EXPIRED' }, { status: 400 });

  const payload = verifyToken(t);
  if (!payload) return NextResponse.json({ error: 'INVITE_EXPIRED' }, { status: 400 });
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return NextResponse.json({ error: 'INVITE_EXPIRED' }, { status: 400 });
  }

  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    // 未ログインならログインへ誘導（戻り先は同URL）
    const to = encodeURIComponent(req.nextUrl.toString());
    return NextResponse.redirect(new URL(`/auth/login?next=${to}`, req.nextUrl));
  }

  // 未失効+未期限切れを確認
  const { data: inv } = await supabase
    .from('invites')
    .select('id, thread_id, revoked, expires_at')
    .eq('id', payload.iid)
    .eq('thread_id', payload.tid)
    .maybeSingle();

  if (!inv || inv.revoked || new Date(inv.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: 'INVITE_EXPIRED' }, { status: 400 });
  }

  // 参加 upsert
  await supabase.from('thread_members').upsert({
    thread_id: payload.tid,
    user_id: auth.user.id,
    role: 'editor',
  });

  return NextResponse.redirect(new URL(`/t/${payload.tid}`, req.nextUrl));
}
