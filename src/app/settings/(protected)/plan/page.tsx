import { createSupabaseRSC } from "@/lib/supabase/server";
import ClientActions from "./ClientActions";

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

  if (auth.user) {
    const { data: row } = await db
      .from("users")
      .select("plan,is_past_due,pro_current_period_end")
      .eq("id", auth.user.id)
      .single();
    plan = (row?.plan as "free" | "pro" | "admin" | undefined) ?? "free";
    isPastDue = Boolean(row?.is_past_due);
    proCurrentPeriodEnd = (row?.pro_current_period_end as string | null) ?? null;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">プラン</h1>

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
