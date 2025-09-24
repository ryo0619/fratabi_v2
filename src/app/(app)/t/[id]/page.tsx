import { getInitial } from "@/lib/history";
import TranslationCard from "@/components/cards/TranslationCard";

export const dynamic = "force-dynamic";

export default async function ThreadPage({ params }: { params: { id: string } }) {
  const { items } = await getInitial(params.id, 50);
  return (
    <div className="p-4 space-y-3">
      {items.map((p) => (
        <TranslationCard key={p.id} phrase={p} />
      ))}
    </div>
  );
}
