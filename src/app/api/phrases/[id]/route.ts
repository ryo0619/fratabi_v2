import { NextResponse } from 'next/server';
import { createSupabaseServer, createSupabaseService } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  // 先に取得（キーが必要）
  const { data: row, error: gErr } = await supabase
    .from('phrases')
    .select('id, thread_id, audio_url')
    .eq('id', id)
    .single();
  if (gErr || !row) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });

  // RLS下で削除（author/ownerのみ許可）
  const { error: dErr } = await supabase.from('phrases').delete().eq('id', params.id);
  if (dErr) {
    const status = dErr.code === '42501' ? 403 : 500;
    return NextResponse.json({ error: status === 403 ? 'FORBIDDEN' : 'NETWORK', message: dErr.message }, { status });
  }

  // 音声オブジェクトも削除（Service Role）
  try {
    if (row.audio_url) {
      const service = createSupabaseService();
      const AUDIO_BUCKET = process.env.SUPABASE_AUDIO_BUCKET ?? 'phrases_fratabi_v2';
      const key = `phrases/${row.thread_id}/${row.id}.mp3`;
      await service.storage.from(AUDIO_BUCKET).remove([key]);
    }
  } catch {}

  return NextResponse.json({ ok: true });
}
