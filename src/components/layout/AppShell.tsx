"use client";

import Link from "next/link";
import useSWR from "swr";
import { useState } from "react";

type Thread = { id: string; title: string; rorle?: string; created_at?: string };

const fetcher = async (url: string) => {
  const r = await fetch(url, { credentials: "include" });
  if (!r.ok) {
    let info: any = null;
    try {
      info = await r.json();
    } catch {}
    const e: any = new Error("Faild to fetch");
    e.status = r.status;
    e.info = info;
    throw e;
  }
  return r.json();
};

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { data, error, isLoading, mutate } = useSWR<Thread[]>("/api/threads", fetcher);

  const threadList: Thread[] = Array.isArray(data) ? data : [];

  const [open, setOpen] = useState(false);

  async function createThread() {
    const res = await fetch("/api/threads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "My phrases" }),
    });
    if (res.ok) {
      await mutate();
      alert("通信エラー。再試行してください");
      return;
    }
    const t: Thread = await res.json();
    mutate();
    location.href = "/t/${t.id}";
  }

  return (
    <div className="min-h-dvh flex">
      {/* Sidebar */}
      <aside className="hidden md:block w-[280px] border-r">
        <div className="p-3">
          <button className="w-full rounded-lg border px-3 py-2" onClick={createThread}>
            ＋ 新しいスレッド
          </button>
        </div>
        {/* ローディング／エラー表示 */}
        {isLoading && <div className="px-3 py-2 text-sm text-gray-500">読み込み中...</div>}
        {error && (
          <div className="px-3 py-2 text-sm text-red-600">
            スレッドの取得に失敗しました({(error as any)?.status ?? "-"})
          </div>
        )}

        <nav className="px-2 py-1 space-y-1">
          <Link className="block px-3 py-2 rounded hover:bg-gray-100" href="/favorites">
            ★ お気に入り
          </Link>
          <Link className="block px-3 py-2 rounded hover:bg-gray-100" href="/settings">
            設定
          </Link>
          <div className="mt-3 text-xs text-gray-500 px-3">スレッド</div>
          <div className="pb-6">
            {threadList.map((t) => (
              <Link
                key={t.id}
                href={`/t/${t.id}`}
                className="block px-3 py-2 rounded hover:bg-gray-100"
              >
                {t.title}
              </Link>
            ))}
            {!isLoading && !error && threadList.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-500">スレッドはまだありません</div>
            )}
          </div>
        </nav>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-12 border-b bg-white z-20 flex items-center">
        <button className="px-3" aria-label="open drawer" onClick={() => setOpen(true)}>
          ☰
        </button>
        <div className="font-semibold">Fratabi</div>
        <div className="ml-auto px-3">
          <Link href="/settings">設定</Link>
        </div>
      </div>
      {/*Drawer(モバイル) */}
      {open && (
        <div className="md:hidden fixed inset-0 z-30" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/20" />
          <div
            className="absolute left-0 top-0 bottom-0 w-72 bg-white p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="mb-3" onClick={createThread}>
              ＋ 新しいスレッド
            </button>
            {isLoading && <div className="py-2 text-sm text-gray-500">読み込み中...</div>}
            {error && (
              <div className="py-2 text-sm text-red-600">
                取得に失敗({(error as any)?.status ?? "-"})
              </div>
            )}
            <Link className="block py-2" href="/favorites" onClick={() => setOpen(false)}>
              ★ お気に入り
            </Link>
            <Link className="block py-2" href="/settings" onClick={() => setOpen(false)}>
              設定
            </Link>
            <div className="mt-2 text-xs text-gray-500">スレッド</div>
            {threadList.map((t) => (
              <Link
                key={t.id}
                href={`/t/${t.id}`}
                className="block py-2"
                onClick={() => setOpen(false)}
              >
                {t.title}
              </Link>
            ))}
            {!isLoading && !error && threadList.length === 0 && (
              <div className="py-2 text-sm text-gray-500">スレッドはまだありません</div>
            )}
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 md:ml-0 md:pl-0 w-full md:static pt-12 md:pt-0">{children}</main>
    </div>
  );
}
