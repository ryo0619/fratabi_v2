"use client";

import useSWR, { SWRConfig } from "swr";
import { useEffect, useMemo, useState } from "react";
import TranslationCard from "@/components/cards/TranslationCard";
import type { PhraseRow } from "@/lib/history";
import { useThreadSelection } from "@/components/threads/ThreadContext";

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json());

export default function HomeClient({
  initialSelectedThreadId,
  fallback,
}: {
  initialSelectedThreadId: string | null;
  fallback: Record<string, unknown>;
}) {
  return (
    <SWRConfig value={{ fallback }}>
      <HomeClientInner initialSelectedThreadId={initialSelectedThreadId} />
    </SWRConfig>
  );
}

function HomeClientInner({
  initialSelectedThreadId,
}: {
  initialSelectedThreadId: string | null;
}) {
  const { selectedThreadId, setSelectedThreadId } = useThreadSelection();
  const [jp, setJp] = useState("");
  const [busy, setBusy] = useState(false);

  // 初期選択をコンテキストに反映（未設定時のみ）
  useEffect(() => {
    if (!selectedThreadId && initialSelectedThreadId) {
      setSelectedThreadId(initialSelectedThreadId);
    }
  }, [selectedThreadId, initialSelectedThreadId, setSelectedThreadId]);

  const { data: threads } = useSWR(`/api/threads`, fetcher);
  const phrasesKey = selectedThreadId
    ? `/api/threads/${selectedThreadId}/phrases?limit=20`
    : null;
  const { data: phrasesPage, mutate: mutatePhrases } = useSWR(
    phrasesKey,
    fetcher
  );
  const phrases = useMemo(() => phrasesPage?.items ?? [], [phrasesPage]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!jp.trim()) return;
    setBusy(true);
    const res = await fetch(`/api/make`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jp, threadId: selectedThreadId }),
    });
    setBusy(false);
    if (res.ok) {
      const t = await res.json();
      setJp("");
      if (!selectedThreadId && t?.thread_id) {
        setSelectedThreadId(t.thread_id);
      }
      await mutatePhrases();
    } else {
      const j = await res.json().catch(() => ({}));
      if (j?.error === "LIMIT_REACHED") {
        alert("上限に達しました。プランをアップグレードしてください");
      } else {
        alert("通信エラー。再試行してください");
      }
    }
  }

  return (
    <main className="mx-auto max-w-[720px] px-4 pb-24">
      <form onSubmit={submit} className="grid gap-3">
        <textarea
          value={jp}
          onChange={(e) => setJp(e.target.value)}
          placeholder="日本語を入力（例：地下鉄の駅はどこですか？）"
          rows={3}
          className="w-full resize-y rounded-xl border border-neutral-200 bg-white p-3 text-base shadow-sm outline-none ring-0 focus:border-neutral-300"
        />
        <button
          disabled={busy || !jp.trim()}
          className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-3 text-white disabled:opacity-50 hover:bg-black"
        >
          {busy ? "生成中..." : "翻訳"}
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {phrases.map((p: PhraseRow) => (
          <TranslationCard key={p.id} phrase={p} />
        ))}
        {selectedThreadId && phrases.length === 0 && (
          <div className="text-sm text-gray-500">
            このスレッドにはまだカードがありません
          </div>
        )}
        {!selectedThreadId && (
          <div className="text-sm text-gray-500">
            スレッドがありません。送信すると自動で作成されます
          </div>
        )}
      </div>
    </main>
  );
}
