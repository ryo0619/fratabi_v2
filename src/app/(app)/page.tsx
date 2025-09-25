"use client";

import useSWR from "swr";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Home() {
  const { data: threads } = useSWR(`/api/threads`, fetcher);
  const latest = threads?.[0];
  const [jp, setJp] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!jp.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/make`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jp, threadId: latest?.id ?? null }),
    });
    setBusy(false);
    if (res.ok) {
      const t = await res.json();
      setJp("");
      location.href = `/t/${latest?.id ?? t.thread_id ?? ""}`;
    } else {
      const j = await res.json().catch(() => ({}));
      if (j?.error === "LIMIT_REACHED") {
        alert("上限に達しました。プランをアップグレードしてください");
      } else {
        alert("通信エラー。app/(app)/page.tsxでエラーです。再思考してください");
      }
    }
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <textarea
          maxLength={300}
          value={jp}
          onChange={(e) => setJp(e.target.value)}
          className="w-full h-28 border rounded p-3"
          placeholder="日本語を入力してください"
        />
        <div className="flex justify-between mt-2">
          <span className="text-xs text-gray-500">{jp.length}/300</span>
          <button
            disabled={busy}
            onClick={submit}
            className="px-3 py-2 rounded bg-black text-white"
          >
            {busy ? "送信中..." : "翻訳を作成"}
          </button>
        </div>
      </div>
      {latest ? (
        <div className="text-sm">
          最新スレッド:
          <Link href={`/t/${latest.id}`} className="underline">
            {latest.title}
          </Link>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          スレッドがありません。送信すると自動で作成されます
        </div>
      )}
    </div>
  );
}
