"use client";
//import { supabaseBrowser } from "@/lib/supabase/browser";
import Image from "next/image";
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
      type="button"
      onClick={signIn}
      title="Googleでサインイン"
      aria-label="Googleでサインイン"
      className="
        inline-flex items-center justify-center
        focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/40
        motion-safe:active:scale-[0.99]
      "
      style={{ minHeight: 44 }}
    >
      <Image
        src="/web_light_rd_SI.svg"
        alt="Sign in with Google"
        width={240}
        height={56}
        priority
        className="
          select-none
          transition-[filter, transform]
          drop-shadow-[0_0_0_rgba(0,0,0,0)]
          hover:drop-shadow-[0_2px_8px_rgba(0,0,0,0.12)]
          active:drop-shadow-[0_1px_4px_rgba(0,0,0,0.16)]
        "
        draggable={false}
      />
    </button>
  );
}
