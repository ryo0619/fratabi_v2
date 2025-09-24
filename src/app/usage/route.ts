import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

function currentPeriodKey() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}
function nextResetISO() {
  const d = new Date();
  d.setUTCMonth(d.getUTCMonth() + 1, 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET() {
  const supabase = await createSupabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const { data: u } = await supabase.from('users').select('plan').eq('id', auth.user.id).single();
  const plan = u?.plan ?? 'free';

  const lifetime = 'lifetime';
  const monthly = currentPeriodKey();

  const periods = plan === 'pro' ? [monthly] : [lifetime];

  const { data: rows } = await supabase
    .from('usage_counters')
    .select('period_key, count')
    .eq('user_id', auth.user.id)
    .in('period_key', periods);

  const count = rows?.[0]?.count ?? 0;
  const limit = plan === 'pro' ? 100 : 20;

  return NextResponse.json({
    plan,
    period_key: plan === 'pro' ? monthly : lifetime,
    limit,
    count,
    remaining: Math.max(0, limit - count),
    next_reset: plan === 'pro' ? nextResetISO() : null,
  });
}
