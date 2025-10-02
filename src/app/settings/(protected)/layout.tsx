import { redirect } from "next/navigation";
import { createSupabaseRSC } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import SettingsNav from "../nav";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseRSC();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth/login");

  return (
    <AppShell>
      <div
        className="mx-auto w-full max-w-[1040px] px-4 py-6"
        style={{
          // scoped theme for settings
          // Parisian Signage: warm white + deep navy + bordeaux
          // these cascade to tailwind css variables in globals
          // without affecting the rest of the app
          // @ts-ignore inline style vars
          ['--background' as any]: '#F7F2E9',
          ['--foreground' as any]: '#111111',
          ['--primary' as any]: '#0E2940',
          ['--destructive' as any]: '#8C1D2E',
          ['--muted' as any]: '#6B7280',
        }}
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-20 self-start">
            <div className="rounded-xl border bg-white/70 backdrop-blur p-2">
              <SettingsNav />
            </div>
          </aside>
          <section className="min-h-[60vh] rounded-xl border bg-white/70 backdrop-blur p-4">
            {children}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
