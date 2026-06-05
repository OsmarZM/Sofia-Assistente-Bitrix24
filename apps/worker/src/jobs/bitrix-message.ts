import { createWorker, profileQueue, recalibrateQueue } from '../queues.js'
import { db } from '@sofia/db'
import { buildBitrixSDKFromEnv } from '@sofia/bitrix'
import { buildProviderRouterFromEnv } from '@sofia/ai-providers'
import { accumulate_cost_entry } from '@sofia/ai-providers'
import {
  embedAndRetrieve,
  buildPrompt,
  isConfident,
  getCachedResponse,
  setCachedResponse,
  LOW_CONFIDENCE_RESPONSE,
  DEGRADED_RESPONSE,
  getThreshold,
} from '@sofia/rag'

type BitrixMessagePayload = {
  eventId: string
  chatId: string
  userId: string
  text: string
  timestamp: string
}

const MAX_HISTORY = 20
const FEEDBACK_THRESHOLD_FOR_RECALIBRATION = 50

export function createBitrixMessageWorker() {
  const bitrix = buildBitrixSDKFromEnv()
  const router = buildProviderRouterFromEnv()

  return createWorker<BitrixMessagePayload>('bitrix-message', async (job) => {
    const { eventId, chatId, userId, text, timestamp } = job.data
    const startAt = Date.now()

    // ── 1. Upsert usuário Bitrix ─────────────────────────────────────────────
    let user = await db.from('users').select('id').eq('bitrix_user_id', userId).single()
    if (!user.data) {
      const userInfo = await bitrix.getUserInfo(userId)
      const { data: newUser } = await db
        .from('users')
        .upsert({
          bitrix_user_id: userId,
          name: userInfo?.name ?? 'Unknown',
          position: userInfo?.position ?? null,
          photo_url: userInfo?.photoUrl ?? null,
          email: userInfo?.email ?? null,
        })
        .select('id')
        .single()
      user = { data: newUser, error: null }
    }

    const internalUserId = user.data?.id

    // ── 2. Upsert sessão (chat = dialog_id) ─────────────────────────────────
    let session = await db.from('chat_sessions').select('*').eq('bitrix_dialog_id', chatId).is('closed_at', null).single()
    if (!session.data) {
      const { data: defaultPhase } = await db
        .from('conversation_phases')
        .select('id')
        .eq('slug', 'nova')
        .single()

      const { data: newSession } = await db
        .from('chat_sessions')
        .insert({
          bitrix_user_id: userId,
          bitrix_dialog_id: chatId,
          current_phase_id: defaultPhase?.id ?? null,
        })
        .select('*')
        .single()
      session = { data: newSession, error: null }
    }

    const sessionId = session.data?.id
    const isSofiaPaused = session.data?.sofia_paused === true

    // ── 3. Sofia pausada? Ignora sem processar ───────────────────────────────
    if (isSofiaPaused) {
      await db.from('bitrix_events').update({ processed: true }).eq('id', eventId)
      return
    }

    // ── 4. Persiste mensagem do usuário ──────────────────────────────────────
    const { data: userMsg } = await db
      .from('chat_messages')
      .insert({ session_id: sessionId, role: 'user', content: text })
      .select('id')
      .single()

    // ── 5. Histórico recente ─────────────────────────────────────────────────
    const { data: history } = await db
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY)

    const recentHistory = (history ?? []).reverse().map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // ── 6. Perfil do usuário ─────────────────────────────────────────────────
    const { data: profile } = await db
      .from('user_profiles')
      .select('topics_json, sentiment_avg, summary')
      .eq('bitrix_user_id', userId)
      .single()

    // ── 7. Cache ─────────────────────────────────────────────────────────────
    const threshold = await getThreshold()
    const cached = await getCachedResponse(text, [])
    if (cached) {
      await bitrix.sendMessage(chatId, cached.response)
      await persistSofiaMessage(sessionId, cached.response, {
        cacheHit: true,
        confidence: 1,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencyMs: Date.now() - startAt,
        providerId: null,
      })
      await advancePhase(sessionId, chatId, userId)
      await db.from('bitrix_events').update({ processed: true }).eq('id', eventId)
      return
    }

    // ── 8. RAG: embed + retrieve ─────────────────────────────────────────────
    let chunks: Awaited<ReturnType<typeof embedAndRetrieve>> = []
    try {
      chunks = await embedAndRetrieve(text, router)
    } catch {
      await bitrix.sendDegradedMessage(chatId)
      await db.from('bitrix_events').update({ processed: true }).eq('id', eventId)
      return
    }

    const confident = isConfident(chunks, threshold)

    if (!confident && chunks.length === 0) {
      // Sem nenhum chunk relevante
      await bitrix.sendMessage(chatId, LOW_CONFIDENCE_RESPONSE)
      await persistSofiaMessage(sessionId, LOW_CONFIDENCE_RESPONSE, {
        cacheHit: false,
        confidence: 0,
        tokensIn: 0,
        tokensOut: 0,
        costUsd: 0,
        latencyMs: Date.now() - startAt,
        providerId: null,
      })
      await advancePhase(sessionId, chatId, userId)
      await db.from('bitrix_events').update({ processed: true }).eq('id', eventId)
      return
    }

    // ── 9. Monta prompt ──────────────────────────────────────────────────────
    const messages = buildPrompt(text, chunks, recentHistory, profile ?? undefined)

    // ── 10. LLM ──────────────────────────────────────────────────────────────
    let result: Awaited<ReturnType<typeof router.chat>> | null = null
    try {
      result = await router.chat(messages)
    } catch {
      await bitrix.sendDegradedMessage(chatId)
      await db.from('bitrix_events').update({ processed: true }).eq('id', eventId)
      return
    }

    if (!result) {
      await bitrix.sendDegradedMessage(chatId)
      await db.from('bitrix_events').update({ processed: true }).eq('id', eventId)
      return
    }

    const finalAnswer = confident ? result.text : `${result.text}\n\n${LOW_CONFIDENCE_RESPONSE}`
    const latencyMs = Date.now() - startAt

    // ── 11. Envia resposta ao Bitrix ─────────────────────────────────────────
    await bitrix.sendMessage(chatId, finalAnswer)

    // ── 12. Persiste mensagem Sofia ──────────────────────────────────────────
    const chunkIds = chunks.map((c) => c.id).filter(Boolean) as string[]
    const confidence = isConfident(chunks, threshold) ? chunks[0]?.score ?? 0 : 0

    await persistSofiaMessage(sessionId, finalAnswer, {
      cacheHit: false,
      confidence,
      tokensIn: result.usage?.inputTokens ?? 0,
      tokensOut: result.usage?.outputTokens ?? 0,
      costUsd: result.costUsd ?? 0,
      latencyMs,
      providerId: result.providerId ?? null,
    })

    // ── 13. Cache set ────────────────────────────────────────────────────────
    await setCachedResponse(text, chunkIds, finalAnswer)

    // ── 14. Custo acumulado ──────────────────────────────────────────────────
    if (result.costUsd) {
      await accumulate_cost_entry('daily', result.costUsd)
    }

    // ── 15. Avança fase do kanban ────────────────────────────────────────────
    await advancePhase(sessionId, chatId, userId)

    // ── 16. Agenda profile-update se for multiplo de 10 msgs ─────────────────
    const { count } = await db
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
    if (count && count % 10 === 0) {
      await profileQueue.add('update', { bitrixUserId: userId, sessionId })
    }

    // ── 17. Dispara recalibração se acumulou N feedbacks ─────────────────────
    const { count: feedbackCount } = await db
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .not('feedback', 'is', null)
    if (feedbackCount && feedbackCount % FEEDBACK_THRESHOLD_FOR_RECALIBRATION === 0) {
      await recalibrateQueue.add('recalibrate', { sessionId })
    }

    // ── 18. Marca evento processado ──────────────────────────────────────────
    await db.from('bitrix_events').update({ processed: true }).eq('id', eventId)
  })
}

// ── Helpers ──────────────────────────────────────────────────────────────────

type MsgMeta = {
  cacheHit: boolean
  confidence: number
  tokensIn: number
  tokensOut: number
  costUsd: number
  latencyMs: number
  providerId: string | null
}

async function persistSofiaMessage(sessionId: string | undefined, content: string, meta: MsgMeta) {
  if (!sessionId) return
  await db.from('chat_messages').insert({
    session_id: sessionId,
    role: 'assistant',
    content,
    provider_id: meta.providerId ?? null,
    tokens_in: meta.tokensIn,
    tokens_out: meta.tokensOut,
    cost_usd: meta.costUsd,
    latency_ms: meta.latencyMs,
    confidence: meta.confidence,
    cache_hit: meta.cacheHit,
  })
  await db
    .from('chat_sessions')
    .update({ last_msg_at: new Date().toISOString() })
    .eq('id', sessionId)
}

async function advancePhase(sessionId: string | undefined, chatId: string, userId: string) {
  if (!sessionId) return
  try {
    await db.rpc('advance_session_phase', { p_session_id: sessionId })
  } catch {
    // não crítico
  }
}
