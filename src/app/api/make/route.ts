import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSupabaseRoute, createSupabaseService } from '@/lib/supabase/server';

// --- ここはファイルの一番上でOK（1回は確実に出る）---
console.log('[make] module loaded at', new Date().toISOString())

export const runtime = 'nodejs';
export const dynamic   = 'force-dynamic'
export const revalidate = 0

// ==== logging helpers ====
const _startedAt = Date.now()
const _reqId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
  ? (crypto as any).randomUUID().slice(0, 8)
  : Math.random().toString(36).slice(2, 10)

function ms() { return `${Date.now() - _startedAt}ms` }
function safeErr(e: any) {
  const o: any = {
    name: e?.name,
    message: e?.message || String(e),
    status: e?.status ?? e?.code ?? e?.error?.code,
    hint: e?.hint,
    details: e?.details || e?.error?.message,
    type: e?.type,
  }
  if (o.details && typeof o.details === 'string' && o.details.length > 300) {
    o.details = o.details.slice(0, 300) + '…'
  }
  return o
}
function log(tag: string, payload?: any) {
  if (payload !== undefined) console.log(`[make ${_reqId}] ${ms()} ${tag}`, payload)
  else console.log(`[make ${_reqId}] ${ms()} ${tag}`)
}
async function step<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const t0 = Date.now()
  log(`▶ ${label}`)
  try {
    const out = await fn()
    log(`✔ ${label} (${Date.now() - t0}ms)`)
    return out
  } catch (e) {
    log(`✖ ${label} (${Date.now() - t0}ms)`, safeErr(e))
    throw e
  }
}
// 非 null を保証したい場面用（.single() の結果など）
function ok<T>(label: string, res: { data: T | null; error: any }): T | null {
  if (res.error) {
    throw Object.assign(new Error(`${label}: ${res.error.message || 'supabase error'}`), res.error)
  }
  return res.data as T | null
}

// 非 null を保証したい場面用（.single() の結果など）
function okOne<T>(label: string, res: { data: T | null; error: any }): T {
  if (res.error) {
    throw Object.assign(new Error(`${label}: ${res.error.message || 'supabase error'}`), res.error)
  }
  if (res.data == null) {
    throw Object.assign(new Error(`${label}: not_found`), { status: 404 })
  }
  return res.data as T
}
// ==== /helpers ====


// --- ソフトレート制限（60秒/10リクエスト・ユーザー単位）
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

// --- プラン別 period_key ---
function periodKey(plan: string) {
  if (plan === 'pro') {
    const d = new Date();
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }
  return 'lifetime';
}

export async function POST(req: Request) {
  log('HIT /api/make', { url: req.url })
  try {
    // 1) 入力
    const raw = await step('1.parse: json', async () => await req.json().catch(() => ({} as any)))
    // UIが text を送っている可能性に対応（jp 優先, 無ければ text）
    const jp = String(
      typeof raw?.jp === 'string' ? raw.jp :
      typeof raw?.text === 'string' ? raw.text : ''
    ).trim()
    const threadId: string | null = raw?.threadId ? String(raw.threadId)
                          : (raw?.thread_id ? String(raw.thread_id) : null)

    log('body.peek', { jp: jp.slice(0, 24), threadId })

    if (!jp || jp.length > 300) {
      return NextResponse.json({ error: 'BAD_REQUEST', code: 'EMPTY_OR_TOO_LONG_JP' }, { status: 400 })
    }

    // 2) Supabase クライアント
    const { supabase } = await step('2.supabase: create', async () => {
      const supabase = await createSupabaseRoute()
      return { supabase }
    })

    // 3) 認証
    const user = await step('3.auth.getUser', async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      if (!data?.user) throw Object.assign(new Error('UNAUTHORIZED'), { status: 401 })
      log('auth.user', { id: data.user.id })
      return data.user
    }).catch((e) => {
      if (e?.status === 401) throw e
      throw Object.assign(e, { status: 500 })
    })
    if (!user) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })

    // 3b) users 行の存在保証（無ければ作る）
    await step('3.user.ensure', async () => {
      const existing = ok<{ id: string } | null>('users.exists', await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle())

      if (!existing) {
        // plan に NOT NULL がない想定。あれば { id: user.id, plan: 'free' } で。
        const up = await supabase
          .from('users')
          .upsert({ id: user.id }, { onConflict: 'id' })
        if (up.error) throw up.error
      }
    })

    // 4) スレッド解決（取得 or 自動作成）
    const resolvedThreadId = await step('4.thread.ensure', async () => {
      if (threadId) {
        const t = ok<{id:string}>('get thread', await supabase
          .from('threads')
          .select('id')
          .eq('id', threadId)
          .maybeSingle())
        if (!t) throw Object.assign(new Error('FORBIDDEN'), { status: 403 })
        return t!.id as string
      }
      const own = ok('select threads', await supabase
        .from('threads')
        .select('id')
        .eq('owner_user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: true })
        .limit(1))
      if (Array.isArray(own) && own.length) return own[0].id as string

      const created = okOne<{ id: string }>('insert threads', await supabase
        .from('threads')
        .insert({ owner_user_id: user.id, title: 'My phrases', archived: false })
        .select('id')
        .single())

      // 所有者をメンバーにも登録（失敗しても致命ではないため握る）
      await supabase.from('thread_members').upsert({
        thread_id: created.id, user_id: user.id, role: 'owner',
      })
    return created.id
    })

    // 5) レート制限
    await step('5.rate-limit', async () => {
      const okRL = await Promise.resolve(rateCheck(user.id))
      if (!okRL) throw Object.assign(new Error('RATE_LIMIT'), { status: 429 })
    })

    // 6) 使用回数チェック
    // const plan = await step<'free' | 'pro'>('6.user.plan', async () => {
    // //   const row = okOne<{ plan: string }>('select users.plan', await supabase
    // //     .from('users')
    // //     .select('plan')
    // //     .eq('id', user.id)
    // //     .single())
    // //   return (row?.plan ?? 'free') as 'free' | 'pro'
    // // })
    // // const pKey = periodKey(plan)
    // // const limit = plan === 'pro' ? 100 : 20

    // // await step('7.usage.rpc', async () => {
    // //   const { data, error } = await supabase.rpc('fratabi_increment_usage', {
    // //     p_user_id: user.id, p_period_key: pKey, p_limit: limit,
    // //   })
    // //   if (error) throw error
    // //   if (!data || (data as any).reached === true) {
    // //     throw Object.assign(new Error('LIMIT_REACHED'), { status: 402 })
    // //   }
    // return;
    // })

    // 8) OpenAI: JA->EN
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const en = await step('8.openai: ja->en', async () => {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Output strict JSON: {"en": "..."}' },
          { role: 'user', content: `Translate Japanese to English:\n${jp}` },
        ],
      })
      const enJson = JSON.parse(res.choices[0].message.content ?? '{}')
      const out = String(enJson.en ?? '').trim()
      if (!out) throw new Error('EMPTY_EN')
      return out
    })

    // 9) OpenAI: EN->FR + Furigana
    const { fr, furigana } = await step('9.openai: en->fr+furigana', async () => {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Output strict JSON: {"fr":"...","furigana":"..."} Keep word spacing.' },
          { role: 'user', content: `Translate to French and provide furigana (kana for each word). Input:\n${en}` },
        ],
      })
      const frJson = JSON.parse(res.choices[0].message.content ?? '{}')
      const fr = String(frJson.fr ?? '').trim()
      const furigana = String(frJson.furigana ?? '').trim()
      if (!fr) throw new Error('EMPTY_FR')
      return { fr, furigana }
    })

    // 10) phrases INSERT（audio_urlは空で先行）
    const phrase = await step('10.db.insert: phrases', async () => {
      const ins = okOne<{ id: string; created_at: string }>('insert phrases', await supabase
        .from('phrases')
        .insert({
          thread_id: resolvedThreadId,
          author_user_id: user.id,
          jp, en, fr, furigana,
          audio_url: '',
        })
        .select('id, created_at')
        .single())
      return ins
    })

    // 11) TTS → Storage（Service Roleで実行）
    const ttsUrl = await step('11.tts + storage', async () => {
      const tts = await openai.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice: 'alloy',
        input: fr,
        // format: 'mp3', // 必要なら明示
      })
      const buffer = Buffer.from(await tts.arrayBuffer())

      const service = createSupabaseService()
      const AUDIO_BUCKET = process.env.SUPABASE_AUDIO_BUCKET ?? 'phrases_fratabi_v2'
      const key = `${resolvedThreadId}/${phrase.id}.mp3`

      const up = await service.storage.from(AUDIO_BUCKET).upload(key, buffer, {
        contentType: 'audio/mpeg',
        upsert: true,
        cacheControl: '31536000, immutable',
      })
      if (up.error) throw up.error

      const { data: pub } = service.storage.from(AUDIO_BUCKET).getPublicUrl(key)
      const url = pub.publicUrl

      // audio_url 更新（Service Role; スキーマ固定で安全）
      const updater = (service as any).schema ? (service as any).schema('fratabi') : service
      const upd = await updater.from('phrases').update({ audio_url: url }).eq('id', phrase.id)
      if ((upd as any)?.error) throw (upd as any).error

      return url
    })

    // 12) レスポンス
    return NextResponse.json({
      id: phrase.id,
      thread_id: resolvedThreadId,
      ja: jp,
      fr,
      furigana,
      tts_url: ttsUrl,
      created_at: phrase.created_at,
    }, { status: 200 })
  } catch (e: any) {
    console.error('[make] fatal:', e)
    const status = e?.status && Number.isInteger(e.status) ? e.status : 500
    return NextResponse.json({ error: e?.message || 'FATAL' }, { status })
  }
}
