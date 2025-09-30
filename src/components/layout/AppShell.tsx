"use client";

import React, { useState } from "react";
import { useSWRConfig } from "swr";
import AppHeader from "./AppHeader";
import PageBackground from "./PageBackground";
import Drawer from "./Drawer";
import { useThreadSelection } from "../threads/ThreadContext";

type Props = { children: React.ReactNode };

function ShellInner({ children }: Props) {
  const [open, setOpen] = useState(false);
  const { setSelectedThreadId } = useThreadSelection();
  const { mutate: globalMutate } = useSWRConfig();

  async function createThread() {
    try {
      console.log('[AppShell] createThread start');
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "My phrases" }),
      });
      console.log('[AppShell] POST /api/threads status', res.status);
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        const msg = typeof j.message === 'string' ? j.message : typeof j.error === 'string' ? j.error : '通信エラー。再試行してください';
        console.error('[AppShell] createThread error:', j);
        alert(msg);
        return;
      }
      const t = (await res.json()) as { id: string; title?: string };
      console.log('[AppShell] thread created', t);
      // 楽観的にスレッド一覧に先頭追加（即時反映）
      globalMutate(
        '/api/threads',
        (curr?: { id: string; title?: string }[]) => {
          const list = Array.isArray(curr) ? curr : [];
          if (list.some((x) => x.id === t.id)) return list;
          return [t, ...list];
        },
        false
      );
      setSelectedThreadId(t.id);
      setOpen(false);
    } catch (e) {
      console.error('[AppShell] createThread exception', e);
      alert('ネットワークエラー。コンソールを確認してください');
    }
  }

  return (
    <div className="relative min-h-dvh text-gray-900 w-full">
      <PageBackground />
      <div className="relative">
        <AppHeader onMenuClick={() => setOpen(true)} />
        <Drawer open={open} onClose={() => setOpen(false)} onCreateThread={createThread} />
        <main className="mx-auto max-w-screen-lg px-4 pt-20 pb-6">{children}</main>
      </div>
    </div>
  );
}

export default function AppShell({ children }: Props) {
  return <ShellInner>{children}</ShellInner>;
}
