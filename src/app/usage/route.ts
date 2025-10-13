import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// 仕様
const FREE_LIMIT = 20;
const PRO_LIMIT = 100;

// JSTの {yyyy-MM} を返す
function currentPeriodKeyJST(): string {
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const yyyy = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const mm = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${yyyy}-${mm}`;
}

// 次回リセット（JSTの毎月1日 00:00）をISO(UTC)で返す
function nextResetISOJST(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(now);

  const yyyy = Number(parts.find((p) => p.type === 'year')?.value ?? '1970');
  const mm = Number(parts.find((p) => p.type === 'month')?.value ?? '1');

  const nextY = mm === 12 ? yyyy + 1 : yyyy;
  const nextM = mm === 12 ? 1 : mm + 1;
  const mmStr = String(nextM).padStart(2, '0');

  return new Date(`${nextY}-${mmStr}-01T00:00:00+09:00`).toISOString();
}

export async function GET() {
  const supabase = await createSupabaseServer();

  // 認証（Cookie経由）
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  const userId = auth.user.id;

  // ✅ スキーマを 'fratabi' に固定して参照
  const db = supabase.schema('fratabi');

  // users から plan を取得（まずは最小：planのみ）
  const { data: u, error: userErr } = await db
    .from('users')
    .select('plan')
    .eq('id', userId)
    .single();

  if (userErr) {
    return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
  }

  const plan = (u?.plan as 'free' | 'pro' | 'admin' | undefined) ?? 'free';

  // 期間キー（admin はカウント対象外）
  const lifetime = 'lifetime';
  const monthly = currentPeriodKeyJST();
  const periodKey =
    plan === 'pro' ? monthly : plan === 'free' ? lifetime : 'admin:unlimited';

  // 使用回数取得（admin はスキップ）
  let count = 0;
  let limit: number | null = null;
  if (plan === 'free') {
    limit = FREE_LIMIT;
  } else if (plan === 'pro') {
    limit = PRO_LIMIT;
  }

  if (plan !== 'admin') {
    const { data: row } = await db
      .from('usage_counters')
      .select('count')
      .eq('user_id', userId)
      .eq('period_key', plan === 'pro' ? monthly : lifetime)
      .maybeSingle();
    count = row?.count ?? 0;
  }

  const remaining = limit === null ? null : Math.max(0, limit - count);
  const overLimit = limit === null ? false : count >= limit;

  // いまは is_past_due / pro_current_period_end を DBにまだ持たない前提で仮値。
  // 後で 'fratabi.users' に列を追加したら、ここを実値に置換する。
  const isPastDue = false;
  const proCurrentPeriodEnd: string | null = null;

  // 最終ブロック判定（翻訳可否に直結）
  const blocked = plan === 'admin' ? false : isPastDue || overLimit;

  return NextResponse.json({
    plan,                               // 'free' | 'pro' | 'admin'
    is_past_due: isPastDue,             // 将来: DB列で上書き
    period_key: periodKey,              // 'free:lifetime' / 'pro:YYYY-MM' / 'admin:unlimited'
    limit,                              // 20 / 100 / null(admin)
    count,                              // 現在の使用回数
    remaining,                          // 残り回数（adminはnull）
    over_limit: overLimit,              // 上限到達か
    blocked,                            // 実際に翻訳を止めるべきか
    next_reset_jst: plan === 'pro' ? nextResetISOJST() : null,
    pro_current_period_end: proCurrentPeriodEnd, // 将来: DB列で上書き
  });
}
