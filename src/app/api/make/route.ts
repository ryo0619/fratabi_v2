import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSupabaseRoute, createSupabaseService } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** --- ソフトレート制限（60秒/10リクエスト・ユーザー単位） --- */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;
const rateBuckets = new Map<string, number[]>();
function rateCheck(userId: string) {
  const now = Date.now();
  const bucket = rateBuckets.get(userId) ?? [];
  const recent = bucket.filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  rateBuckets.set(userId, recent);
  return recent.length <= RATE_MAX;
}

/** --- プラン別 period_key --- */
function periodKey(plan: string) {
  if (plan === 'pro') {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return 'lifetime';
}

export async function POST(req: Request) {
  // 入力
  const body = await req.json().catch(() => ({}));
  const jp = (body?.jp ?? '').toString();
  const threadId: string | null = body?.threadId ? String(body.threadId) : null;
  if (!jp || jp.length > 300) {
    return NextResponse.json({ error: 'NETWORK', message: 'invalid jp' }, { status: 400 });
  }

  // Supabase（Route Handler 用：Cookie書込可）
  const supabase = await createSupabaseRoute();

  // 認証
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  // レート制限
  if (!rateCheck(auth.user.id)) {
    return NextResponse.json({ error: '429_RATE' }, { status: 429 });
  }

  // スレッド解決（指定あり→存在/権限確認、指定なし→既定or作成）
  let resolvedThreadId: string;
  if (threadId) {
    const { data: t, error } = await supabase
      .from('threads')
      .select('id')
      .eq('id', threadId)
      .limit(1)
      .maybeSingle();
    if (error || !t) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    resolvedThreadId = t.id;
  } else {
    const { data: own } = await supabase
      .from('threads')
      .select('id')
      .eq('owner_user_id', auth.user.id)
      .eq('archived', false)
      .order('created_at', { ascending: true })
      .limit(1);
    if (own && own.length) {
      resolvedThreadId = own[0].id;
    } else {
      const { data: t, error: e1 } = await supabase
        .from('threads')
        .insert({ owner_user_id: auth.user.id, title: 'My phrases', archived: false })
        .select('id')
        .single();
      if (e1) return NextResponse.json({ error: 'NETWORK', message: e1.message }, { status: 500 });
      await supabase.from('thread_members').upsert({
        thread_id: t.id,
        user_id: auth.user.id,
        role: 'owner',
      });
      resolvedThreadId = t.id;
    }
  }

  // 使用回数チェック（1文アトミック：DB関数を呼ぶ）
  const { data: userRow } = await supabase
    .from('users')
    .select('plan')
    .eq('id', auth.user.id)
    .single();
  const plan = (userRow?.plan ?? 'free') as 'free' | 'pro';
  const pKey = periodKey(plan);
  const limit = plan === 'pro' ? 100 : 20;

  const { data: inc, error: incErr } = await supabase.rpc('fratabi_increment_usage', {
    p_user_id: auth.user.id,
    p_period_key: pKey,
    p_limit: limit,
  });
  if (incErr) {
    return NextResponse.json({ error: 'NETWORK', message: incErr.message }, { status: 500 });
  }
  if (!inc || inc.reached === true) {
    return NextResponse.json({ error: 'LIMIT_REACHED', code: '402_LIMIT' }, { status: 402 });
  }

  // OpenAI 呼び出し
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // JA -> EN（JSON厳守）
  const enRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: 'Output strict JSON: {"en": "..."}' },
      { role: 'user', content: `Translate Japanese to English:\n${jp}` },
    ],
  });
  const enJson = JSON.parse(enRes.choices[0].message.content ?? '{}');
  const en = String(enJson.en ?? '').trim();

  // EN -> FR + Furigana（スペース維持・JSON厳守）
  const frRes = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Output strict JSON: {"fr":"...","furigana":"..."} Keep word spacing.',
      },
      { role: 'user', content: `Translate to French and provide furigana (kana for each word). Input:\n${en}` },
    ],
  });
  const frJson = JSON.parse(frRes.choices[0].message.content ?? '{}');
  const fr = String(frJson.fr ?? '').trim();
  const furigana = String(frJson.furigana ?? '').trim();

  // phrases INSERT（audio_urlは空で先行）
  const { data: phrase, error: insErr } = await supabase
    .from('phrases')
    .insert({
      thread_id: resolvedThreadId,
      author_user_id: auth.user.id,
      jp,
      en,
      fr,
      furigana,
      audio_url: '',
    })
    .select('id, created_at')
    .single();
  if (insErr) return NextResponse.json({ error: 'NETWORK', message: insErr.message }, { status: 500 });

  // TTS → Storage（Service Roleで実行）
  const tts = await openai.audio.speech.create({
    model: 'gpt-4o-mini-tts',
    voice: 'alloy',
    input: fr,
  });
  const buffer = Buffer.from(await tts.arrayBuffer()); // デフォでmp3

  const service = createSupabaseService();
  const AUDIO_BUCKET = process.env.SUPABASE_AUDIO_BUCKET ?? 'phrases_fratabi_v2';
  const key = `${resolvedThreadId}/${phrase.id}.mp3`;

  const { error: upErr } = await service.storage.from(AUDIO_BUCKET).upload(key, buffer, {
    contentType: 'audio/mpeg',
    upsert: true,
    cacheControl: '31536000, immutable',
  });
  if (upErr) return NextResponse.json({ error: 'NETWORK', message: upErr.message }, { status: 500 });

  const { data: pub } = service.storage.from(AUDIO_BUCKET).getPublicUrl(key);
  const audioUrl = pub.publicUrl;

  // audio_url 更新（Service Roleで確実に反映）
  const { error: up2 } = await service.from('phrases').update({ audio_url: audioUrl }).eq('id', phrase.id);
  if (up2) return NextResponse.json({ error: 'NETWORK', message: up2.message }, { status: 500 });

  // レスポンス
  return NextResponse.json({
    id: phrase.id,
    ja: jp,
    fr,
    furigana,
    tts_url: audioUrl,
    created_at: phrase.created_at,
  });
}
