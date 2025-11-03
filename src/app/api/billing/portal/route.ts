import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseRoute } from '@/lib/supabase/server';

export const runtime = 'nodejs'

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Server misconfigured: STRIPE_SECRET_KEY missing');
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  try {
    // Cookieセッションで認証
    const supabase = await createSupabaseRoute()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401})
    const userId = auth.user.id

    // users@fratabi から stripe_customer_id を取得
    const db = supabase.schema('fratabi')
    const { data: prof, error: profErr } = await db
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()

      if (profErr || !prof?.stripe_customer_id) {
        return NextResponse.json({ error: 'No Stripe customer' }, { status: 400})
      }

      const origin = req.nextUrl.origin
      const stripe = getStripe();
      const session = await stripe.billingPortal.sessions.create({
        customer: prof.stripe_customer_id,
        return_url: `${origin}/settings`,
      })

      return NextResponse.json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'portal failed';
    return NextResponse.json({ error: message }, { status: 400});
  }
}
