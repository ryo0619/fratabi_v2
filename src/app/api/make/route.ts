import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSupabaseRoute, createSupabaseService } from '@/lib/supabase/server';

// --- ここはファイルの一番上でOK（1回は確実に出る）---
const ENABLE_LOG = process.env.NODE_ENV !== 'production'
if (ENABLE_LOG) console.log('[make] module loaded at', new Date().toISOString())

export const runtime = 'nodejs';
export const dynamic   = 'force-dynamic'
export const revalidate = 0

// ==== logging helpers ====
const _startedAt = Date.now()
const _reqId = (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
  ? (crypto as Crypto).randomUUID().slice(0, 8)
  : Math.random().toString(36).slice(2, 10)

function ms() { return `${Date.now() - _startedAt}ms` }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function getProp<T>(obj: unknown, key: string): T | undefined {
  if (!isObject(obj)) return undefined
  return (obj as Record<string, unknown>)[key] as T | undefined
}

function safeErr(e: unknown) {
  const name = getProp<unknown>(e, 'name')
  const messageProp = getProp<unknown>(e, 'message')
  const statusProp = getProp<unknown>(e, 'status')
  const codeProp = getProp<unknown>(e, 'code')
  const hint = getProp<unknown>(e, 'hint')
  const detailsProp = getProp<unknown>(e, 'details')
  const errorObj = getProp<unknown>(e, 'error')
  const errorCode = getProp<unknown>(errorObj, 'code')
  const errorMessage = getProp<unknown>(errorObj, 'message')

  const o: Record<string, unknown> = {
    name: typeof name === 'string' ? name : undefined,
    message: typeof messageProp === 'string' ? messageProp : String(e),
    status: statusProp ?? codeProp ?? errorCode,
    hint,
    details: detailsProp ?? errorMessage,
    type: getProp<unknown>(e, 'type'),
  }
  if (typeof o.details === 'string' && o.details.length > 300) {
    o.details = o.details.slice(0, 300) + '…'
  }
  return o
}

function log(tag: string, payload?: unknown) {
  if (!ENABLE_LOG) return
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
function ok<T>(label: string, res: { data: T | null; error: unknown }): T | null {
  if (res.error) {
    const msg = getProp<string>(res.error, 'message') ?? 'supabase error'
    const assignSrc = isObject(res.error) ? res.error : {}
    throw Object.assign(new Error(`${label}: ${msg}`), assignSrc)
  }
  return res.data as T | null
}

// 非 null を保証したい場面用（.single() の結果など）
function okOne<T>(label: string, res: { data: T | null; error: unknown }): T {
  if (res.error) {
    const msg = getProp<string>(res.error, 'message') ?? 'supabase error'
    const assignSrc = isObject(res.error) ? res.error : {}
    throw Object.assign(new Error(`${label}: ${msg}`), assignSrc)
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

// --- プラン別 period_key（JSTでのYYYY-MM。freeは生涯=lifetime）---
function periodKey(plan: string) {
  if (plan === 'pro') {
    const parts = new Intl.DateTimeFormat('ja-JP', {
      timeZone: 'Asia/Tokyo',
      year: 'numeric',
      month: '2-digit',
    }).formatToParts(new Date())
    const yyyy = parts.find((p) => p.type === 'year')?.value ?? '1970'
    const mm = parts.find((p) => p.type === 'month')?.value ?? '01'
    return `${yyyy}-${mm}`
  }
  return 'lifetime';
}

export async function POST(req: Request) {
  log('HIT /api/make', { url: req.url })
  try {
    // 1) 入力
    const raw = await step('1.parse: json', async () => await req.json().catch(() => ({} as Record<string, unknown>)))
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
      const db = supabase as any;
      const existing = ok<{ id: string } | null>('users.exists', await db
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle())

      if (!existing) {
        // plan に NOT NULL がない想定。あれば { id: user.id, plan: 'free' } で。
        const up = await db
          .from('users')
          .upsert({ id: user.id }, { onConflict: 'id' })
        if (up.error) throw up.error
      }
    })

    // 4) スレッド解決（取得 or 自動作成）
    const resolvedThreadId = await step('4.thread.ensure', async () => {
      const db = supabase as any;
      if (threadId) {
        const t = ok<{id:string}>('get thread', await supabase
          .from('threads')
          .select('id')
          .eq('id', threadId)
          .maybeSingle())
        if (!t) throw Object.assign(new Error('FORBIDDEN'), { status: 403 })
        return t!.id as string
      }
      const own = ok<Array<{ id: string }>>('select threads', await supabase
        .from('threads')
        .select('id')
        .eq('owner_user_id', user.id)
        .eq('archived', false)
        .order('created_at', { ascending: true })
        .limit(1))
      if (Array.isArray(own) && own.length) return own[0]!.id

      const created = okOne<{ id: string }>('insert threads', await db
        .from('threads')
        .insert({ owner_user_id: user.id, title: 'My phrases', archived: false })
        .select('id')
        .single())

      // 所有者をメンバーにも登録（失敗しても致命ではないため握る）
      await db.from('thread_members').upsert({
        thread_id: created.id, user_id: user.id, role: 'owner',
      })
      return created.id
      })

    // 5) レート制限
    await step('5.rate-limit', async () => {
      const okRL = await Promise.resolve(rateCheck(user.id))
      if (!okRL) throw Object.assign(new Error('RATE_LIMIT'), { status: 429 })
    })

    // 6) 使用回数チェック（プランに応じて増分・上限判定）
    await step('6.usage.check+increment', async () => {
      type PlanRow = { plan: string | null }
      const row = okOne<PlanRow>('select users.plan', await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single())

      const curPlan = ((row?.plan ?? 'free') as 'free' | 'pro' | 'admin')
      if (curPlan === 'admin') return; // 無制限

      const pKey = periodKey(curPlan)
      const limit = curPlan === 'pro' ? 100 : 20

      // 現在のカウントを取得
      const { data: usageRow } = await supabase
        .from('usage_counters')
        .select('count')
        .eq('user_id', user.id)
        .eq('period_key', pKey)
        .maybeSingle()

      const current = usageRow?.count ?? 0
      if (current >= limit) {
        throw Object.assign(new Error('LIMIT_REACHED'), { status: 402 })
      }

      // 無ければ 1 で作成、あれば current+1 に更新（衝突時は上書き）。
      // 競合が極小前提の簡易実装。高頻度ならDB関数/トランザクションへ移行検討。
      const next = current + 1
      const up = await (supabase as any)
        .from('usage_counters')
        .upsert({ user_id: user.id, period_key: pKey, count: next }, { onConflict: 'user_id,period_key' })
      if (up.error) throw up.error
    })

    // 8) OpenAI: JA->FR + Furigana（英語の橋渡しは行わない）
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
    const prompt_ja2fr = `
    以下の指示に厳密に従ってください。
    あなたは「日本からフランスへ旅行する日本人」向けの通訳です。日本語を、フランス本国（パリ）で自然・丁寧・口語的に使える短いフランス語へ訳し、日本人が読みやすいカタカナ発音も返します。出力は必ず次のJSONのみにします：
    {"fr":"...","furigana":"..."}

    ##スタイル規則
    1.想定場面：買い物・道案内・飲食・ホテル・交通などの旅行会話。相手は初対面の大人 → vous を基本。
    2.口語度：自然で短い口語を優先（書き言葉・仰々しい表現は避ける）。
    3.丁寧さ：必要に応じて “s’il vous plaît” を末尾に（頼みごと・依頼・確認など）。挨拶や謝意も短く自然に。
    4.地域性：フランス本国標準（カナダ・ベルギー由来の語法やスラングは使わない）。
    5.語の選択の優先順位（重要）：
      価格を指して尋ねる（品物を指差し等）→ 「C’est combien ?」 を最優先。
      料金・費用の一般質問（サービス料金等）→ 「Ça coûte combien ?」 を次点。
      フォーマル過ぎる・冗長な言い回し（例：Combien ça coûte ? を乱発）は避け、上の優先順位に従う。
    6.あいまい語の既定解釈：
      「いいです」→ 文脈が依頼受諾なら D’accord.、辞退なら Non merci.
      「〜してください」→ 簡潔な依頼 + s’il vous plaît
      「〜はありますか？」→ Est-ce que vous avez ~ ? / Vous avez ~ ?（場面により短い後者も可）
    7.数字・通貨：口頭で自然に。ユーロは “€” 記号可。TTSで読ませやすいよう、過度な省略や記号連続は避ける。
    8.句読点：疑問は “?”、必要最小限のカンマ。三点リーダや絵文字禁止。
    9.出力形式：JSONのみ。キーは "fr" と "furigana" の2つ。前後に説明や改行、コードブロック、追加キーを一切付けない。
    ##カタカナ表記ルール
    日本語話者が読んで近似できる実用表記。過度な学術的厳密さより旅行者の再現性を優先。
    長母音は ー。鼻母音は近似（ex. bon→「ボン」）。
    連音・リエゾンは、実際の発音が明確なときのみ区切りを調整（例：s’il vous plaît→「スィル ヴ プレ」／一般的表記「シルヴプレ」でも可だが一貫させる）。
    アポストロフィ（j’, l’, qu’ など）は日本語リズムで区切りやすく（例：J’aimerais→「ジェメレ」）。
    固有名詞はカタカナ慣用最優先（Paris→「パリ」）。
    ##出力チェックリスト
    旅行場面として不自然でないか
    **短い・口語・丁寧（vous）**か
    規則5の優先順位に合致しているか
    JSONのみ・キー名・引用符が正しいか
    カタカナが日本人に読みやすいか
    ##使い方（User メッセージの形）
    ユーザーの日本文だけを渡します。あなたは上記ルールで訳し、JSONのみ返してください。
    ##動作確認用ミニ・サンプル（Few-shot）
    1.日本語：「これはいくらですか？」
      → {"fr":"C’est combien ?","furigana":"セ コンビアン？"}
    2.日本語：「このTシャツは別のサイズありますか？」
      → {"fr":"Vous avez ce T-shirt dans une autre taille ?","furigana":"ヴ ザヴェ ス ティーシャツ ダン ズノートル タイユ？"}
    3.日本語：「駅はどちらですか？」
      → {"fr":"La gare, c’est par où ?","furigana":"ラ ギャール、セ パル？"}
    4.日本語：「すみません、メニューをください。」
      → {"fr":"Excusez-moi, la carte s’il vous plaît.","furigana":"エクスキュゼ モワ、ラ カルト シル ヴ プレ。"}
    5.日本語：「空港までいくらくらいかかりますか？」
      → {"fr":"Ça coûte combien jusqu’à l’aéroport ?","furigana":"サ クート コンビアン ジュスカ レアロポール？"}
    6.日本語：「お水をもらえますか？」
      → {"fr":"Une carafe d’eau, s’il vous plaît.","furigana":"ユヌ カラフ ドー、シル ヴ プレ"}
    ##補足
    あなたは決して代替案を並記しない（1つに確定）。
    依頼・確認・質問系では原則として文末に s’il vous plaît を付ける。
    “Combien ça coûte ?” を多用しすぎない。物の値段指し示しは “C’est combien ?” を基本。
    出力は常に1行のJSON。余計な空白・解説・改行は禁止。
    `

    const { fr, furigana } = await step('8.openai: ja->fr+furigana', async () => {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: prompt_ja2fr },
          { role: 'user', content: jp },
        ],
        temperature: 0.2,
      })
      const frJson = JSON.parse(res.choices[0].message.content ?? '{}')
      const fr = String(frJson.fr ?? '').trim()
      const furigana = String(frJson.furigana ?? '').trim()
      if (!fr) throw new Error('EMPTY_FR')
      return { fr, furigana }
    })
    const en: string | null = null

    // 10) phrases INSERT（audio_urlは空で先行）
    const phrase = await step('10.db.insert: phrases', async () => {
      const db = supabase as any;
      const ins = okOne<{ id: string; created_at: string }>('insert phrases', await db
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
      type HasSchema<T> = T & { schema?: (name: string) => T }
      function hasSchema<T extends object>(s: T): s is T & { schema: (name: string) => T } {
        return typeof (s as Record<string, unknown>)['schema'] === 'function'
      }
      function hasError(x: unknown): x is { error: unknown } {
        return typeof x === 'object' && x !== null && 'error' in x
      }

      const svc = service as HasSchema<typeof service>
      const updater = hasSchema(svc) ? svc.schema('fratabi') : service
      const upd = await updater.from('phrases').update({ audio_url: url }).eq('id', phrase.id)
      if (hasError(upd) && upd.error) throw upd.error

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
  } catch (e) {
    console.error('[make] fatal:', e)
    const statusRaw = getProp<unknown>(e, 'status')
    const status = typeof statusRaw === 'number' && Number.isInteger(statusRaw) ? statusRaw : 500
    const message = e instanceof Error
      ? e.message
      : (getProp<string>(e, 'message') ?? 'FATAL')
    return NextResponse.json({ error: message }, { status })
  }
}
