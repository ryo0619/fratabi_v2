import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { cardId } = await req.json().catch(() => ({}));
  if (!cardId) return NextResponse.json({ error: 'NETWORK' }, { status: 400 });

  const { error } = await supabase.from('favorites').upsert({
    user_id: auth.user.id,
    card_id: cardId,
  });
  if (error) return NextResponse.json({ error: 'NETWORK', message: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
