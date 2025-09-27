import { NextResponse } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseRoute();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { title } = await req.json().catch(() => ({}));
  const safe = (title ?? '').toString().slice(0, 80);
  if (!safe) return NextResponse.json({ error: 'NETWORK', message: 'title required' }, { status: 400 });

  // RLSで許可（owner or editor想定）
  const { data, error } = await supabase
    .from('threads')
    .update({ title: safe })
    .eq('id', params.id)
    .select('id,title')
    .single();

  if (error) {
    const status = error.code === '42501' ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'FORBIDDEN' : 'NETWORK', message: error.message }, { status });
  }
  return NextResponse.json(data);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createSupabaseRoute();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  // RLSでownerのみ許可。phrasesはDB側でCASCADE設定前提
  const { error } = await supabase.from('threads').delete().eq('id', params.id);
  if (error) {
    const status = error.code === '42501' ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'FORBIDDEN' : 'NETWORK', message: error.message }, { status });
  }
  return NextResponse.json({ ok: true });
}
