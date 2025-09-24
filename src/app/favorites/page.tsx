"use client";

import useSWRInfinite from "swr/infinite";
import TranslationCard from "@/components/cards/TranslationCard";

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const getKey = (index: number, prev: any) => {
  if (prev && !prev.nextCursor) return null;
  const cursor = index === 0 ? "" : `?cursor=${encodeURIComponent(prev.nextCursor)}`;
  return `/api/favorites${cursor}`;
};

export default function FavoritesPage() {
  const { data, size, setSize } = useSWRInfinite(getKey, fetcher);
  const items = (data ?? []).flatMap((p: any) => p.items ?? []);

  return (
    <div className="p-4 space-y-3">
      <div className="text-xs text-gray-500">※オフライン同期は後続でIndexedDB連携を追加</div>
      {items.map((it: any) => (
        <TranslationCard key={it.card.id} phrase={it.card} />
      ))}
      {data && data.at(-1)?.nextCursor && (
        <button className="w-full border rounded py-2" onClick={() => setSize(size + 1)}>
          さらに読み込む
        </button>
      )}
    </div>
  );
}
