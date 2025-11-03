import { createSupabaseRSC } from "@/lib/supabase/server";
import ClientActions from "./ClientActions";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

type PlanProps = {
  plan: "free" | "pro" | "admin";
  isPastDue: boolean;
  proCurrentPeriodEnd: string | null;
};

export default async function PlanSettingsPage() {
  const supabase = await createSupabaseRSC();
  const { data: auth } = await supabase.auth.getUser();
  const db = supabase.schema("fratabi");

  let plan: "free" | "pro" | "admin" = "free";
  let isPastDue = false;
  let proCurrentPeriodEnd: string | null = null;

  // /usage API のレスポンス型（最低限）
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

  let usage: UsagePayload | null = null;
  let usageStatus: number | null = null;

  if (auth.user) {
    const { data: row } = await db
      .from("users")
      .select("plan,is_past_due,pro_current_period_end")
      .eq("id", auth.user.id)
      .single();
    plan = (row?.plan as "free" | "pro" | "admin" | undefined) ?? "free";
    isPastDue = Boolean(row?.is_past_due);
    proCurrentPeriodEnd = (row?.pro_current_period_end as string | null) ?? null;

    // 併せて利用状況を取得（サーバーから内部フェッチ：Cookie転送）
    try {
      const h = await headers();
      const cookie = h.get("cookie");
      const r = await fetch("/usage", {
        cache: "no-store",
        headers: cookie ? { cookie } : undefined,
      });
      usageStatus = r.status;
      if (r.ok) {
        const j = (await r.json()) as UsagePayload;
        usage = j;
      }
    } catch {
      // 失敗時は usage を null のまま
    }

    // フォールバック：/usage が取れない場合は直接 Supabase から合成
    if (!usage) {
      // 期間キー（JST）
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
      if (plan !== "admin") {
        const { data: urow } = await db
          .from("usage_counters")
          .select("count")
          .eq("user_id", auth.user.id)
          .eq("period_key", plan === "pro" ? pKey : "lifetime")
          .maybeSingle();
        count = urow?.count ?? 0;
      }
      const remaining = limit === null ? null : Math.max(0, limit - count);

      usage = {
        plan,
        count,
        limit,
        remaining,
        over_limit: limit === null ? false : count >= limit,
        blocked: plan === "admin" ? false : isPastDue || (limit !== null && count >= limit),
        is_past_due: isPastDue,
        next_reset_jst: plan === "pro" ? null : null,
      };
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">プラン</h1>

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
                次回リセット（JST）:{" "}
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
            {usageStatus === 401
              ? "ログインセッションが無効です。再ログインしてください。"
              : "利用状況を取得できませんでした"}
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="text-sm text-neutral-500">現在のプラン</div>
        <div className="text-base font-medium">
          {plan === "pro" ? "Pro" : plan === "admin" ? "Admin" : "Free"}
        </div>
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

      <div className="rounded-xl border bg-white p-4 space-y-3">
        <ClientActions plan={plan} />
      </div>
    </div>
  );
}
