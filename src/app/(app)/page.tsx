import { createSupabaseRSC } from "@/lib/supabase/server";
import HomeClient from "./HomeClient";

export default async function Home() {
  const supabase = await createSupabaseRSC();
  const { data: auth } = await supabase.auth.getUser();

  // スレッド一覧（最近順）
  let threads: { id: string; title: string; created_at?: string }[] = [];
  if (auth.user) {
    const { data: memberRows } = await supabase
      .from("thread_members")
      .select("thread_id")
      .eq("user_id", auth.user.id);

    const ids = Array.from(new Set((memberRows ?? []).map((r) => r.thread_id)));
    if (ids.length) {
      const { data: tRows } = await supabase
        .from("threads")
        .select("id, title, created_at")
        .in("id", ids)
        .order("created_at", { ascending: false });
      threads = (tRows ?? []).map((t) => ({ id: t.id, title: (t as any).title, created_at: (t as any).created_at }));
    }
  }

  const selectedThreadId = threads.length ? threads[0].id : null;

  // 選択スレッドの初期フレーズ
  let phrasesPage: { items: any[]; nextCursor: string | null } | null = null;
  if (selectedThreadId) {
    const { data } = await supabase
      .from("phrases")
      .select("id,jp,fr,furigana,audio_url,created_at")
      .eq("thread_id", selectedThreadId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(20);
    const items = data ?? [];
    const nextCursor = items.length ? `${items.at(-1)!.created_at}::${items.at(-1)!.id}` : null;
    phrasesPage = { items, nextCursor };
  }

  // SWRの初期キャッシュ（fallback）
  const fallback: Record<string, unknown> = {
    "/api/threads": threads,
  };
  if (selectedThreadId && phrasesPage) {
    fallback[`/api/threads/${selectedThreadId}/phrases?limit=20`] = phrasesPage;
  }

  return <HomeClient initialSelectedThreadId={selectedThreadId} fallback={fallback} />;
}
