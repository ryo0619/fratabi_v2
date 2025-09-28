"use client";
//import { supabaseBrowser } from "@/lib/supabase/browser";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function LoginClient() {
  async function signIn() {
    const supabase = createSupabaseBrowser();
    const origin = window.location.origin;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
        queryParams: { prompt: "select_account" },
      },
    });
  }

  return (
    <button
      onClick={signIn}
      className="w-full rounded-lg border bg-gray-900 px-4 py-2 text-white hover:opacity-90"
      aria-label="Sign in with Google"
    >
      Googleでサインイン
    </button>
  );
}
