import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function DELETE(_: Request, { params }: { params: { cardId: string } }) {
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('card_id', params.cardId);

  if (error) return NextResponse.json({ error: 'NETWORK', message: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
