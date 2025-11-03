"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoRedirect({ to, delayMs = 2000 }: { to: string; delayMs?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => {
      router.replace(to);
    }, delayMs);
    return () => clearTimeout(t);
  }, [router, to, delayMs]);
  return null;
}

