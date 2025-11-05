import { redirect } from "next/navigation";
import { createSupabaseRSC } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";
import type { CSSProperties } from "react";

export const dynamic = "force-dynamic";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseRSC();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth/login");

  // Scoped theme variables for the settings section only
  const themeVars: CSSProperties & { [key: `--${string}`]: string } = {
    "--background": "#F7F2E9",
    "--foreground": "#111111",
    "--primary": "#0E2940",
    "--destructive": "#8C1D2E",
    "--muted": "#6B7280",
  };

  return (
    <AppShell>
      <div
        className="mx-auto w-full max-w-[1040px] px-4 py-6"
        style={themeVars}
      >
        <section className="min-h-[60vh] rounded-xl border bg-white/70 backdrop-blur p-4">
          {children}
        </section>
      </div>
    </AppShell>
  );
}
