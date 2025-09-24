import { redirect } from "next/navigation";
import { createSupabaseRSC } from "@/lib/supabase/server";
import AppShell from "@/components/layout/AppShell";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseRSC();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth/login");
  return <AppShell>{children}</AppShell>;
}
