import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(new URL(`/auth/login?error=missing_code`, request.url));
  }

  const supabase = await createSupabaseServer();

  // SupabaseのOAuthコードをセッションに交換
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url));
  }

  // ログイン直後にアプリ用ユーザーを upsert（id/email だけ先置き）
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await supabase
      .from("fratabi.users")
      .upsert({ id: user.id, email: user.email ?? null }, { onConflict: "id" });
  }

  return NextResponse.redirect(new URL(next, request.url));
}
