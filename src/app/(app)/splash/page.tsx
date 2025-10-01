"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSWRConfig } from "swr";
import { useThreadSelection } from "@/components/threads/ThreadContext";
import { garamond, decol, zenMaru } from "@/lib/fonts";

type Thread = { id: string; title?: string };
type BootstrapPayload = { threads: Thread[] };

export default function SplashPage() {
  const router = useRouter();
  const { mutate } = useSWRConfig();
  const { setSelectedThreadId } = useThreadSelection();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/bootstrap", { credentials: "include" });
        if (!res.ok) throw new Error("bootstrap failed");
        const data = (await res.json()) as BootstrapPayload;
        if (cancelled) return;
        // Seed threads cache for Home and set default selection
        const threads = Array.isArray(data.threads) ? data.threads : [];
        mutate("/api/threads", threads, false);
        if (threads.length) setSelectedThreadId(threads[0].id);
      } catch (e) {
        // 失敗してもHomeへ進める（Home側で通常の取得に任せる）
      } finally {
        if (!cancelled) router.replace("/");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mutate, router, setSelectedThreadId]);

  return (
    <main className="relative grid min-h-svh place-items-center">
      <div className={`${zenMaru.className} text-4xl font-semibold tracking-wide text-gray-900`}>
        Bonjour
      </div>
    </main>
  );
}
