import AppShell from "@/components/layout/AppShell";

export default function SettingsLogoutDone() {
  return (
    <AppShell>
      <main className="mx-auto max-w-[720px] px-4 py-16">
        <div className="rounded-2xl border bg-white/80 backdrop-blur p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">ログアウトしました</h1>
          <p className="text-sm text-neutral-600 mb-6">ご利用ありがとうございました。</p>
          <a href="/auth/login" className="inline-block rounded-lg border px-4 py-2 text-sm bg-neutral-900 text-white">
            ログイン画面へ
          </a>
        </div>
      </main>
    </AppShell>
  );
}
