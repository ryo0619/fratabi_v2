import { NextResponse } from 'next/server';
import { createSupabaseRSC } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createSupabaseRSC();
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get('limit') ?? '20'), 100);
    const cursor = url.searchParams.get('cursor');
    const { id } = await params;

    let query = supabase
      .from('phrases')
      .select('id,jp,fr,furigana,audio_url,created_at')
      .eq('thread_id', id)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    if (cursor) {
      const [ts, lastId] = cursor.split('::');
      query = query.or(`and(created_at.lt.${ts}),and(created_at.eq.${ts},id.lt.${lastId})`);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: 'NETWORK', message: error.message }, { status: 500 });
    }
    const items = data ?? [];
    const nextCursor = items.length ? `${items.at(-1)!.created_at}::${items.at(-1)!.id}` : null;
    return NextResponse.json({ items, nextCursor });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: 'FATAL', message: msg }, { status: 500 });
  }
}
