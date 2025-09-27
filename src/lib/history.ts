import { createSupabaseServer } from '@/lib/supabase/server';

export type PhraseRow = {
  id: string;
  thread_id: string;
  author_user_id: string;
  jp: string;
  en: string | null;
  fr: string;
  furigana: string;
  audio_url: string | null;
  created_at: string;
};
export type Page = { items: PhraseRow[]; nextCursor: string | null };

/** SSR 初期50件 */
export async function getInitial(threadId: string, limit = 50): Promise<Page> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('phrases')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  const items = data as PhraseRow[];
  const nextCursor = items.length ? `${items.at(-1)!.created_at}::${items.at(-1)!.id}` : null;
  return { items, nextCursor };
}

/** 追加ロード（cursor: `${created_at}::${id}`） */
export async function getMore(threadId: string, cursor: string, limit = 50): Promise<Page> {
  const [ts, lastId] = cursor.split('::');
  const supabase = await createSupabaseServer();

  // created_at < ts OR (created_at = ts AND id < lastId)
  const { data, error } = await supabase
    .from('phrases')
    .select('*')
    .eq('thread_id', threadId)
    .or(`and(created_at.lt.${ts}),and(created_at.eq.${ts},id.lt.${lastId})`)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  const items = data as PhraseRow[];
  const nextCursor = items.length ? `${items.at(-1)!.created_at}::${items.at(-1)!.id}` : null;
  return { items, nextCursor };
}
