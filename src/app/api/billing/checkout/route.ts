// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createSupabaseRoute } from '@/lib/supabase/server';

export const runtime = 'nodejs' // Stripe SDKとWebhook検証はEdge不可

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: NextRequest) {
  try {
    // 1) 認証（Cookie/RLS）
    const supabase = await createSupabaseRoute()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = auth.user.id
    const email = auth.user.email ?? undefined

    // 2) Price解決（lookup_key→price_id）
    const prices = await stripe.prices.list({
      lookup_keys: [process.env.STRIPE_PRICE_LOOKUP_KEY!],
      active: true,
      limit: 1,
      expand: ['data.product'],
    })
    const price = prices.data[0]
    if (!price) return NextResponse.json({ error: 'Price not found' }, { status: 400 })

    // 3) 既存customer取得 or 作成（users@fratabi）
    const db = supabase.schema('fratabi')
    type StripeIdRow = { stripe_customer_id: string | null }
    const res = await db
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single()
    const prof = (res as unknown as { data: StripeIdRow | null }).data

    let customerId = (prof?.stripe_customer_id ?? undefined) as string | undefined
    if (!customerId) {
      const customer = await stripe.customers.create({ email, metadata: { user_id: userId } })
      customerId = customer.id
      await db
        .from('users')
        .update({ stripe_customer_id: customerId } as any)
        .eq('id', userId)
    }

    // 4) Checkout Session作成（mode=subscription）
    const origin = req.nextUrl.origin
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/cancel`,
      metadata: { user_id: userId }, // Webhookで逆引きするため
      // proration_behavior: 'none' //（按分なし運用なら必要に応じて）
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    const message = e instanceof Error ? e.message : 'checkout failed';
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
