import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import type { PhraseRow } from '@/lib/history';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get('limit') ?? '50'), 100);
  const cursor = url.searchParams.get('cursor');

  // 直接JOIN（関係定義がある前提）。なければ2段クエリに変更
  let query = supabase
    .from('favorites')
    .select('created_at, card_id, phrases!inner(*)')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (cursor) query = query.lt('created_at', cursor);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'NETWORK', message: error.message }, { status: 500 });
  type FavJoined = { created_at: string; card_id: string; phrases: PhraseRow };
  const rows = (data ?? []) as unknown as FavJoined[];
  const items = rows.map(r => ({ created_at: r.created_at, card: r.phrases }));
  const nextCursor = items.length ? items.at(-1)!.created_at : null;
  return NextResponse.json({ items, nextCursor });
}
