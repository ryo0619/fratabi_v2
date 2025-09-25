"use client";
import { useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage() {
  const supa = useMemo(() => createSupabaseBrowser(), []);
  const [busy, setBusy] = useState(false);

  const signInGoogle = async () => {
    try {
      setBusy(true);
      const redirectTo = `${location.origin}/auth/callback`;
      const { data, error } = await supa.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (error) throw error;
      // data.url に遷移していく（SDKが自動でリダイレクト開始）
    } catch (e: any) {
      alert(`ログインに失敗しました: ${e?.message || e}`);
      setBusy(false);
    }
  };

  return (
    <div className="min-h-svh grid place-items-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">ログイン</h1>
        <button
          onClick={signInGoogle}
          disabled={busy}
          className="w-full rounded bg-black text-white py-2"
        >
          {busy ? "リダイレクト中…" : "Googleでログイン"}
        </button>
      </div>
    </div>
  );
}
