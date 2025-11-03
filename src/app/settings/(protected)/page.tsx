import { createSupabaseRSC } from "@/lib/supabase/server";
import ClientActions from "./plan/ClientActions";
import { headers } from "next/headers";
import LogoutButton from "../LogoutButton";

export const dynamic = "force-dynamic";

type UsagePayload = {
  plan: "free" | "pro" | "admin";
  count: number;
  limit: number | null;
  remaining: number | null;
  over_limit: boolean;
  blocked: boolean;
  is_past_due: boolean;
  next_reset_jst: string | null;
};

export default async function SettingsUnifiedPage() {
  const supabase = await createSupabaseRSC();
  const { data: auth } = await supabase.auth.getUser();
  const db = supabase.schema("fratabi");

  // プロフィール
  const [{ data: profRow }, { data: userRow }] = await Promise.all([
    db.from("users").select("id,display_name,email,plan,is_past_due,pro_current_period_end").limit(1).single(),
    db.from("users").select("plan,is_past_due,pro_current_period_end").eq("id", auth.user?.id ?? "").maybeSingle(),
  ]);

  const email = profRow?.email ?? auth.user?.email ?? "";
  const displayName = profRow?.display_name ?? "";

  const plan = (userRow?.plan as "free" | "pro" | "admin" | undefined) ?? "free";
  const isPastDue = Boolean(userRow?.is_past_due);
  const proCurrentPeriodEnd: string | null = (userRow?.pro_current_period_end as string | null) ?? null;

  // 利用状況を /usage 経由で取得（Cookie転送）、失敗時はフォールバック
  let usage: UsagePayload | null = null;
  let usageStatus: number | null = null;
  try {
    const h = await headers();
    const cookie = h.get("cookie");
    const r = await fetch("/usage", { cache: "no-store", headers: cookie ? { cookie } : undefined });
    usageStatus = r.status;
    if (r.ok) usage = (await r.json()) as UsagePayload;
  } catch {}

  if (!usage) {
    function currentPeriodKeyJST(): string {
      const parts = new Intl.DateTimeFormat("ja-JP", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
      }).formatToParts(new Date());
      const yyyy = parts.find((p) => p.type === "year")?.value ?? "1970";
      const mm = parts.find((p) => p.type === "month")?.value ?? "01";
      return `${yyyy}-${mm}`;
    }
    const limit = plan === "admin" ? null : plan === "pro" ? 100 : 20;
    const pKey = plan === "pro" ? currentPeriodKeyJST() : plan === "free" ? "lifetime" : "admin:unlimited";
    let count = 0;
    if (plan !== "admin" && auth.user) {
      const { data: urow } = await db
        .from("usage_counters")
        .select("count")
        .eq("user_id", auth.user.id)
        .eq("period_key", plan === "pro" ? pKey : "lifetime")
        .maybeSingle();
      count = urow?.count ?? 0;
    }
    const remaining = limit === null ? null : Math.max(0, (limit ?? 0) - count);
    usage = {
      plan,
      count,
      limit,
      remaining,
      over_limit: limit === null ? false : count >= (limit ?? 0),
      blocked: plan === "admin" ? false : isPastDue || (limit !== null && count >= (limit ?? 0)),
      is_past_due: isPastDue,
      next_reset_jst: plan === "pro" ? null : null,
    };
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">設定</h1>

      {/* アカウント */}
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm text-neutral-500">アカウント</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="text-xs text-neutral-500 mb-1">表示名</div>
            <div className="text-base font-medium">{displayName || "未設定"}</div>
          </div>
          <div>
            <div className="text-xs text-neutral-500 mb-1">メールアドレス</div>
            <div className="text-base font-medium break-all">{email || "未設定"}</div>
          </div>
        </div>
      </div>

      {/* ご利用回数 */}
      <div className="rounded-xl border bg-white p-4 space-y-2">
        <div className="text-sm text-neutral-500">ご利用回数</div>
        {usage ? (
          <div className="space-y-1">
            {usage.limit === null ? (
              <div className="text-base font-medium">無制限（Admin）</div>
            ) : (
              <div className="text-base font-medium">
                {usage.count} 回 / {usage.limit} 回
                {typeof usage.remaining === "number" && (
                  <span className="ml-2 text-sm text-neutral-600">残り: {usage.remaining} 回</span>
                )}
              </div>
            )}
            {usage.plan === "pro" && usage.next_reset_jst && (
              <div className="text-sm text-neutral-600">
                次回リセット（JST）：
                {new Date(usage.next_reset_jst).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
              </div>
            )}
            {usage.is_past_due && (
              <div className="text-sm text-red-600">支払いに問題があります（past due）</div>
            )}
            {usage.over_limit && usage.limit !== null && (
              <div className="text-sm text-orange-600">上限に達しています</div>
            )}
          </div>
        ) : (
          <div className="text-sm text-neutral-600">
            {usageStatus === 401 ? "ログインセッションが無効です。再ログインしてください。" : "利用状況を取得できませんでした"}
          </div>
        )}
      </div>

      {/* 現在のプラン */}
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm text-neutral-500">現在のプラン</div>
        <div className="text-base font-medium">{plan === "pro" ? "Pro" : plan === "admin" ? "Admin" : "Free"}</div>
        {plan === "pro" && (
          <div className="text-sm text-neutral-600">
            {isPastDue ? (
              <span className="text-red-600">支払いに問題があります（past due）</span>
            ) : proCurrentPeriodEnd ? (
              <>有効期限: {new Date(proCurrentPeriodEnd).toLocaleString()}</>
            ) : null}
          </div>
        )}
      </div>

      {/* プラン操作 */}
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <ClientActions plan={plan} />
      </div>

      {/* ログアウト */}
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm text-neutral-500">セッション</div>
        <LogoutButton />
      </div>
    </div>
  );
}
