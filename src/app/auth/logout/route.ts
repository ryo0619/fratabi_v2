import { NextResponse } from 'next/server'
import { createSupabaseRoute } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createSupabaseRoute()
  await supabase.auth.signOut()
  const origin = new URL(req.url).origin
  return NextResponse.redirect(`${origin}/settings/logout`)
}

export async function GET(req: Request) {
  const supabase = await createSupabaseRoute()
  await supabase.auth.signOut()
  const origin = new URL(req.url).origin
  return NextResponse.redirect(`${origin}/settings/logout`)
}
