"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function ClientActions({ plan }: { plan: "free" | "pro" | "admin" }) {
  const [loading, setLoading] = useState<null | "checkout" | "portal">(null);

  const goCheckout = async () => {
    try {
      setLoading("checkout");
      const supabase = createSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("未ログインです");

      const r = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.url) throw new Error(j?.error || "Checkoutの開始に失敗しました");
      window.location.href = j.url as string;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Checkoutの開始に失敗しました");
    } finally {
      setLoading(null);
    }
  };

  const goPortal = async () => {
    try {
      setLoading("portal");
      const supabase = createSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("未ログインです");

      const r = await fetch("/api/billing/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j?.url) throw new Error(j?.error || "ポータルの開始に失敗しました");
      window.location.href = j.url as string;
    } catch (e) {
      alert(e instanceof Error ? e.message : "ポータルの開始に失敗しました");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      {plan === "free" && (
        <button
          onClick={goCheckout}
          disabled={loading !== null}
          className="rounded-lg bg-blue-600 text-white px-4 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          {loading === "checkout" ? "リダイレクト中…" : "Proにアップグレード（Stripe）"}
        </button>
      )}

      {plan === "pro" && (
        <button
          onClick={goPortal}
          disabled={loading !== null}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-neutral-50 disabled:opacity-50"
        >
          {loading === "portal" ? "リダイレクト中…" : "支払い管理（Stripeポータル）"}
        </button>
      )}

      {plan === "admin" && (
        <div className="text-sm text-neutral-600">管理者プランのため課金設定は不要です。</div>
      )}
    </div>
  );
}

