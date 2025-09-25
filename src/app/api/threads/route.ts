import { NextResponse } from 'next/server';
//import { createSupabaseServer } from '@/lib/supabase/server';
import { createSupabaseRoute } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = await createSupabaseRoute();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    // 自分がmemberのthread一覧
    const { data: memberRows, error: mErr } = await supabase
      .from('thread_members')
      .select('thread_id, role')
      .eq('user_id', auth.user.id);

    if (mErr) {
      console.error('[threads][GET] member query error:', mErr);
      return NextResponse.json({ error: 'NETWORK', message: mErr.message }, { status: 500 });
    }

    const ids = [...new Set(memberRows?.map(r => r.thread_id) ?? [])];
    if (ids.length === 0) return NextResponse.json([]);

    const { data: threads, error: tErr } = await supabase
      .from('threads')
      .select('id, title, owner_user_id, archived, created_at')
      .in('id', ids)
      .order('created_at', { ascending: true });

    if (tErr) {
      console.error('[threads][GET] list query error:', tErr);
      return NextResponse.json({ error: 'NETWORK', message: tErr.message }, { status: 500 });
    }

    // roleを付与して返却
    const roles = Object.fromEntries((memberRows ?? []).map(r => [r.thread_id, r.role]));
    return NextResponse.json((threads ?? []).map(t => ({ ...t, role: roles[t.id] ?? 'viewer' })));
  } catch (e: any) {
    console.error('[threads][GET] fatal:', e);
    return NextResponse.json({ error: 'FATAL', message: e?.message ?? String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try{
  const supabase = await createSupabaseRoute();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { title } = await req.json().catch(() => ({}));
  const safeTitle = (title ?? 'My phrases').toString().slice(0, 80);

  const { data: t, error: e1 } = await supabase
    .from('threads')
    .insert({
      owner_user_id: auth.user.id,
      title: safeTitle,
      archived: false,
    })
    .select('id, title')
    .single();

  //if (e1) return NextResponse.json({ error: 'NETWORK', message: e1.message }, { status: 500 });
  if (e1) {
    console.error('[threads][POST] insert error:', e1);
    return NextResponse.json({ error: 'NETWORK', message: e1.message }, { status: 500 });
  }

  const { error: e2 } = await supabase.from('thread_members').upsert({
    thread_id: t.id,
    user_id: auth.user.id,
    role: 'owner',
  });

  //if (e2) return NextResponse.json({ error: 'NETWORK', message: e2.message }, { status: 500 });
  if (e2) {
    console.error('[threads][POST] upsert member error:', e2);
    return NextResponse.json({ error: 'NETWORK', message: e2.message }, { status: 500 });
  }

  //return NextResponse.json(t);
  return NextResponse.json({ id: t.id, title: t.title });
  } catch (e: any) {
    console.error('[threads][POST] failed:', e);
    return NextResponse.json({ error: 'NETWORK', message: String(e?.message || e) }, { status: 500 });
  }
}
