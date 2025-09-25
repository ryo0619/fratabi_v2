import { getInitial } from "@/lib/history";
import TranslationCard from "@/components/cards/TranslationCard";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // ← ここがポイント
  const { items } = await getInitial(id, 50);
  return (
    <div className="p-4 space-y-3">
      {items.map((p) => (
        // ...既存の描画...
        <TranslationCard key={p.id} phrase={p} />
      ))}
    </div>
  );
}
