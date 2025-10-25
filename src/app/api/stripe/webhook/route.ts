// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs'; // 署名検証は生ボディ必須のためEdge不可

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Server misconfigured: STRIPE_SECRET_KEY missing');
  return new Stripe(key);
}

// Subscription.items[].current_period_end の“最小値”をISOに正規化
function periodEndISO(sub: Stripe.Subscription): string | null {
  // 型進化の都合で any キャスト（SDKバージョン差異に強くする）
  const ends = (sub.items.data as any[])
    .map((i) => i?.current_period_end as number | undefined)
    .filter((n): n is number => typeof n === 'number');
  if (!ends.length) return null;
  return new Date(Math.min(...ends) * 1000).toISOString();
}

// “pro扱い”と見なす Subscription ステータス（canceled以外は plan=pro を維持）
function isActiveLike(status: Stripe.Subscription.Status): boolean {
  return ['active', 'trialing', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid'].includes(status);
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  // JSONにせず、文字列のまま取得
  const body = await req.text();

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    const wh = process.env.STRIPE_WEBHOOK_SECRET;
    if (!wh) throw new Error('Server misconfigured: STRIPE_WEBHOOK_SECRET missing');
    event = stripe.webhooks.constructEvent(body, sig, wh);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Signature verification failed'
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured: SUPABASE keys missing' }, { status: 500 })
  }
  const sbAdmin = createClient(supabaseUrl, serviceKey)
  const db = sbAdmin.schema('fratabi');

  try {
    switch (event.type) {
      /**
       * Checkout完了 → plan=pro / stripe_* 保存 / period_end 同期 / is_past_due=false
       * （以後の updated/deleted/payment_failed は stripe_customer_id をキーに同期）
       */
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;

        const userId = s.metadata?.user_id ?? null;
        const customerId = (s.customer as string) || null;
        const subscriptionId = (s.subscription as string) || null;

        // 可能なら period_end を取得
        let periodISO: string | null = null;
        if (subscriptionId) {
          const stripe = getStripe();
          const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ['items'] });
          periodISO = periodEndISO(sub);
        }

        if (userId) {
          // admin は開発者向けの無制限プラン。手動で admin にされたユーザーは plan を変更しない。
          const { data: cur } = await db
            .from('users')
            .select('plan')
            .eq('id', userId)
            .single();

          const updates: Record<string, unknown> = {
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            pro_current_period_end: periodISO,
            is_past_due: false,
          }
          if ((cur?.plan as string | undefined) !== 'admin') {
            updates.plan = 'pro'
          }

          await db.from('users').update(updates as any).eq('id', userId);
        }
        break;
      }

      /**
       * サブスク状態の変化（更新）→ period_end / is_past_due（および plan 再同期待ち直し）
       */
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        const status = sub.status;

        // 現在のプランを確認し、adminなら plan は書き換えない
        const { data: cur } = await db
          .from('users')
          .select('plan')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        const updates: Record<string, unknown> = {
          pro_current_period_end: periodEndISO(sub),
          is_past_due: status === 'past_due',
        }

        if ((cur?.plan as string | undefined) !== 'admin' && isActiveLike(status)) {
          updates.plan = 'pro'
        }

        await db.from('users').update(updates as any).eq('stripe_customer_id', customerId);
        break;
      }

      /**
       * サブスク削除（キャンセル完了）→ plan=free / subscription_id クリア / is_past_due=false
       */
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const { data: cur } = await db
          .from('users')
          .select('plan')
          .eq('stripe_customer_id', customerId)
          .maybeSingle();

        const updates: Record<string, unknown> = {
          stripe_subscription_id: null,
          is_past_due: false,
        }
        if ((cur?.plan as string | undefined) !== 'admin') {
          updates.plan = 'free'
        }

        await db.from('users').update(updates as any).eq('stripe_customer_id', customerId);
        break;
      }

      /**
       * 請求の失敗 → is_past_due = true（翻訳ブロック用フラグ）
       */
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await db
          .from('users')
          .update({ is_past_due: true } as any)
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        // 必要になれば他イベントも順次追加
        break;
    }

    return NextResponse.json({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Webhook handler error'
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
