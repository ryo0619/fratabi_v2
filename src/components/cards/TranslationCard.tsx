"use client";

import { useEffect, useRef, useState } from "react";
import type { PhraseRow } from "@/lib/history";
import { fav_get, fav_remove, fav_upsert } from "@/lib/favoritesStore";

export default function TranslationCard({
  phrase,
  onUnfavorite,
  onDelete,
}: {
  phrase: PhraseRow;
  onUnfavorite?: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const [fav, setFav] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [deleted, setDeleted] = useState(false);

  // 初期化：オフライン保存の有無からfav状態を復元
  useEffect(() => {
    let mounted = true;
    fav_get(phrase.id).then((v) => {
      if (mounted) setFav(!!v);
    });
    return () => {
      mounted = false;
    };
  }, [phrase.id]);

  async function toggleFav() {
    setBusy(true);
    try {
      const offline = typeof navigator !== "undefined" && !navigator.onLine;
      if (!fav) {
        if (!offline) {
          await fetch("/api/favorite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cardId: phrase.id }),
          });
        }
        await fav_upsert(phrase);
        setFav(true);
      } else {
        if (!offline) {
          await fetch(`/api/favorite/${phrase.id}`, { method: "DELETE" });
        }
        await fav_remove(phrase.id);
        setFav(false);
        onUnfavorite?.(phrase.id);
      }
    } finally {
      setBusy(false);
    }
  }

  async function del() {
    if (!confirm("このカードを削除します。よろしいですか？")) return;
    const res = await fetch(`/api/phrases/${phrase.id}`, { method: "DELETE" });
    if (res.ok) {
      // お気に入りにもあれば削除
      try {
        await fav_remove(phrase.id);
      } catch {}
      // 楽観的に非表示（Reactのレンダリングで除去）
      setDeleted(true);
      onDelete?.(phrase.id);
    } else {
      alert("通信エラー。再試行してください。");
    }
  }

  function onPlayClick() {
    try {
      if (!phrase.audio_url) return;
      let a = audioRef.current;
      // 再生中なら一時停止
      if (a && !a.paused) {
        a.pause();
        setPlaying(false);
        return;
      }
      // インスタンスがなければ作成し、終了時に状態を戻す
      if (!a) {
        a = new Audio(phrase.audio_url);
        audioRef.current = a;
        a.addEventListener("ended", () => setPlaying(false));
      } else if (a.ended) {
        a.currentTime = 0;
      }
      setPlaying(true);
      a.play().catch(() => setPlaying(false));
    } catch {
      setPlaying(false);
    }
  }

  if (deleted) return null;

  return (
    <div
      id={`card-${phrase.id}`}
      className="relative rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
    >
      {/* お気に入り（カード右上） */}
      <button
        aria-label="favorite"
        disabled={busy}
        onClick={toggleFav}
        className={`absolute top-2 right-2 inline-flex items-center justify-center rounded-full border px-2 py-1 text-sm ${
          fav ? "bg-yellow-100 border-yellow-300" : "bg-white border-gray-200 hover:bg-gray-50"
        }`}
        title="お気に入り"
      >
        ★
      </button>
      <div className="font-medium">{phrase.jp}</div>
      <div>{phrase.fr}</div>
      <div>{phrase.furigana}</div>

      <div className="flex items-center gap-3 mt-3">
        {/* 左下：再生ボタンのみ */}
        <button
          type="button"
          onClick={onPlayClick}
          disabled={!phrase.audio_url}
          aria-label="再生"
          className={`grid size-10 place-items-center rounded-full border ${
            phrase.audio_url
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-gray-200 text-gray-400 border-gray-200"
          }`}
          title="再生"
        >
          {playing ? (
            // 一時停止アイコン
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" />
            </svg>
          ) : (
            // 再生アイコン
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path d="M8 5l11 7-11 7V5z" fill="currentColor" />
            </svg>
          )}
        </button>

        {/* 右隣：削除（Trashアイコンのみ、赤） */}
        <button
          type="button"
          aria-label="delete"
          onClick={del}
          className="grid size-10 place-items-center rounded-full border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
            <path
              d="M3 6h18M9 6v12m6-12v12M5 6l1.5 14A2 2 0 0 0 8.5 22h7a2 2 0 0 0 2-2L19 6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
