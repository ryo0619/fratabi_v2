import { createSupabaseServer } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const supabase = await createSupabaseServer();
  const [{ data: user }, usage] = await Promise.all([
    supabase.auth.getUser(),
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/usage`, { cache: "no-store" }).then((r) =>
      r.json()
    ),
  ]);

  const portalUrl = process.env.STRIPE_CUSTOMER_PORTAL_URL;

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl border p-4">
        <div className="font-semibold mb-2">アカウント</div>
        <div className="text-sm">メール: {user?.user?.email}</div>
      </div>

      <div className="rounded-xl border p-4">
        <div className="font-semibold mb-2">プラン / 使用回数</div>
        <div className="text-sm">プラン: {usage.plan}</div>
        <div className="text-sm">
          残回数: {usage.remaining} / {usage.limit}
        </div>
        {usage.next_reset && (
          <div className="text-xs text-gray-500">
            次回リセット: {new Date(usage.next_reset).toLocaleString()}
          </div>
        )}
        {portalUrl && (
          <a href={portalUrl} target="_blank" className="inline-block mt-3 underline">
            Stripe Customer Portal
          </a>
        )}
      </div>

      <form action="/auth/logout" method="post">
        <button className="px-3 py-2 rounded bg-gray-100 border">ログアウト</button>
      </form>
    </div>
  );
}
