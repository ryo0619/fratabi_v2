"use client";

import { useState } from "react";

export default function TranslationCard({ phrase }: { phrase: any }) {
  const [fav, setFav] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);

  async function toggleFav() {
    setBusy(true);
    try {
      if (!fav) {
        await fetch("/api/favorite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cardId: phrase.id }),
        });
        setFav(true);
      } else {
        await fetch(`/api/favorite/${phrase.id}`, { method: "DELETE" });
        setFav(false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm("このカードを削除します。よろしいですか？")) return;
    const res = await fetch(`/api/phrases/${phrase.id}`, { method: "DELETE" });
    if (res.ok) {
      // 楽観的にDOMから外す
      const el = document.getElementById(`card-${phrase.id}`);
      el?.remove();
    } else {
      alert("通信エラー。再試行してください。");
    }
  }

  return (
    <div id={`card-${phrase.id}`} className="rounded-xl border p-4 space-y-2">
      <div className="text-sm text-gray-500">JP</div>
      <div className="font-medium">{phrase.jp}</div>

      <div className="text-sm text-gray-500 mt-2">FR</div>
      <div>{phrase.fr}</div>

      <div className="text-sm text-gray-500 mt-2">フリガナ</div>
      <div>{phrase.furigana}</div>

      <div className="flex items-center gap-3 mt-2">
        {phrase.audio_url ? (
          <audio controls src={phrase.audio_url} className="w-full" />
        ) : (
          <div className="text-sm text-gray-500">音声の準備中…</div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          aria-label="favorite"
          disabled={busy}
          onClick={toggleFav}
          className={`px-2 py-1 rounded ${fav ? "bg-yellow-100" : "bg-gray-100"}`}
          title="お気に入り"
        >
          ★
        </button>
        <button
          aria-label="delete"
          onClick={del}
          className="px-2 py-1 rounded bg-red-50 text-red-600"
        >
          削除
        </button>
        <span className="ml-auto text-xs text-gray-500">
          {new Date(phrase.created_at).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
