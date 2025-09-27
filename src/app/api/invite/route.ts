import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'nodejs';

type Payload = { tid: string; role: 'editor'; exp: number; iid: string };

function signToken(payload: Payload) {
  const secret = process.env.INVITE_TOKEN_SECRET!;
  if (!secret || secret.length < 32) throw new Error('INVITE_TOKEN_SECRET too short');
  const p = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(p).digest('base64url');
  return `${p}.${sig}`;
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { threadId, role, ttlHours } = await req.json().catch(() => ({}));
  if (!threadId) return NextResponse.json({ error: 'NETWORK' }, { status: 400 });
  const _role = role === 'editor' ? 'editor' : 'editor';
  const ttl = Math.max(1, Math.min(Number(ttlHours ?? 48), 168));
  const exp = Math.floor(Date.now() / 1000) + ttl * 3600;

  // 権限確認（RLS下でowner/editorのみthreadsに触れる前提）
  const { data: t, error: e0 } = await supabase.from('threads').select('id').eq('id', threadId).single();
  if (e0 || !t) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  // 既存招待を失効
  await supabase.from('invites').update({ revoked: true }).eq('thread_id', threadId).eq('revoked', false);

  // 新規作成
  const { data: inv, error: e1 } = await supabase
    .from('invites')
    .insert({
      thread_id: threadId,
      role: _role,
      expires_at: new Date(exp * 1000).toISOString(),
      revoked: false,
      created_by: auth.user.id,
    })
    .select('id')
    .single();
  if (e1) return NextResponse.json({ error: 'NETWORK', message: e1.message }, { status: 500 });

  const token = signToken({ tid: threadId, role: _role, exp, iid: inv.id });

  // 返却（クライアントでコピー用）
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '') || 'https://';
  const url = `${origin}/join?t=${token}`;
  return NextResponse.json({ token, url, expires_at: exp });
}
