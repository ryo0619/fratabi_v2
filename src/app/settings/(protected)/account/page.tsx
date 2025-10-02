import { createSupabaseRSC } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const supabase = await createSupabaseRSC();
  const [{ data: auth }, { data: profile }] = await Promise.all([
    supabase.auth.getUser(),
    // users テーブルから display_name / email を取得（RLS前提）
    (supabase as any)
      .from('users')
      .select('id,display_name,email,plan')
      .limit(1)
      .single(),
  ]);

  const email = profile?.email ?? auth.user?.email ?? '';
  const displayName = profile?.display_name ?? '';

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">アカウント</h1>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 text-sm text-neutral-500">表示名</div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-medium">{displayName || '未設定'}</div>
          <button className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50">変更</button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4">
        <div className="mb-3 text-sm text-neutral-500">メールアドレス</div>
        <div className="flex items-center justify-between gap-3">
          <div className="text-base font-medium break-all">{email || '未設定'}</div>
          <button className="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50">変更</button>
        </div>
      </div>
    </div>
  );
}

