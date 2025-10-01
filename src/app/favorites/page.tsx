"use client";

import { useEffect, useMemo, useState } from "react";
import useSWRInfinite from "swr/infinite";
import TranslationCard from "@/components/cards/TranslationCard";
import type { PhraseRow } from "@/lib/history";
import { fav_bulkUpsert, fav_getAll } from "@/lib/favoritesStore";

type FavItem = { card: PhraseRow; created_at?: string };
type FavPage = { items: FavItem[]; nextCursor: string | null };

const fetcher = (url: string) =>
  fetch(url, { credentials: "include" }).then((r) => r.json() as Promise<FavPage>);
const getKey = (index: number, prev: FavPage | null) => {
  if (prev && !prev.nextCursor) return null;
  const cursor = index === 0 ? "" : `?cursor=${encodeURIComponent(prev!.nextCursor as string)}`;
  return `/api/favorites${cursor}`;
};

export default function FavoritesPage() {
  const { data, size, setSize } = useSWRInfinite<FavPage>(getKey, fetcher, {
    revalidateOnFocus: false,
  });

  // 1) IndexedDB から初期値を読み込み（オフラインでも表示）
  const [cached, setCached] = useState<PhraseRow[] | null>(null);
  useEffect(() => {
    fav_getAll()
      .then(setCached)
      .catch(() => setCached([]));
  }, []);

  // 2) オンライン時は取得できたデータをキャッシュに反映
  const onlineItems = useMemo(() => (data ?? []).flatMap((p) => p.items ?? []), [data]);
  useEffect(() => {
    if (!onlineItems.length) return;
    const cards = onlineItems.map((it) => it.card);
    fav_bulkUpsert(cards).catch(() => {});
  }, [onlineItems]);

  // 3) 表示するリスト（オンライン: API、オフライン: キャッシュ）
  const baseItems: PhraseRow[] = onlineItems.length
    ? onlineItems.map((it) => it.card)
    : cached ?? [];
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const showItems: PhraseRow[] = useMemo(
    () => baseItems.filter((c) => !hiddenIds.has(c.id)),
    [baseItems, hiddenIds]
  );
  const handleUnfavorite = (id: string) => setHiddenIds((prev) => new Set(prev).add(id));

  const hasMore = !!(data && data.at(-1)?.nextCursor);

  return (
    <main className="mx-auto max-w-[720px] px-4 pb-24">
      {!onlineItems.length && (
        <div className="text-xs text-gray-500">オフライン表示中（キャッシュ）</div>
      )}
      <div className="mt-6 space-y-3">
        {showItems.map((card) => (
          <TranslationCard key={card.id} phrase={card} onUnfavorite={handleUnfavorite} />
        ))}
        {onlineItems.length > 0 && hasMore && (
          <button className="w-full border rounded py-2" onClick={() => setSize(size + 1)}>
            さらに読み込む
          </button>
        )}
      </div>
    </main>
  );
}
