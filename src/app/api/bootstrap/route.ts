import { NextResponse } from 'next/server';
import { createSupabaseRoute } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseRoute();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  // threads 一覧を取得（最新順）
  const { data: threads, error } = await (supabase as any)
    .from('threads')
    .select('id,title,created_at')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ threads: threads ?? [] });
}

