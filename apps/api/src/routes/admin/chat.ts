import type { FastifyInstance } from 'fastify'
import { db } from '@sofia/db'

export async function adminChatRoute(app: FastifyInstance) {
  // Lista sessões (kanban)
  app.get('/sessions', async (req, reply) => {
    const { phase, open, limit = '50' } = req.query as Record<string, string>

    let query = db
      .from('chat_sessions')
      .select(
        `*, conversation_phases(name, slug, color), users!chat_sessions_bitrix_user_id_fkey(name, photo_url, position)`
      )
      .order('last_msg_at', { ascending: false })
      .limit(+limit)

    if (phase) query = query.eq('current_phase_id', phase)
    if (open === 'true') query = query.is('closed_at', null)

    const { data, error } = await query
    if (error) return reply.code(500).send({ error: error.message })

    return data
  })

  // Mensagens de uma sessão
  app.get<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/messages',
    async (req, reply) => {
      const { data, error } = await db
        .from('chat_messages')
        .select('*, ai_providers(name, type)')
        .eq('session_id', req.params.sessionId)
        .order('created_at', { ascending: true })

      if (error) return reply.code(500).send({ error: error.message })
      return data
    }
  )

  // Live: sessões ativas atualizadas nos últimos N segundos
  app.get('/sessions/live', async (req, reply) => {
    const { since = '10' } = req.query as Record<string, string>
    const sinceDate = new Date(Date.now() - +since * 1000).toISOString()

    const { data, error } = await db
      .from('chat_sessions')
      .select(`*, conversation_phases(name, slug, color), users!chat_sessions_bitrix_user_id_fkey(name, photo_url)`)
      .gt('last_msg_at', sinceDate)
      .is('closed_at', null)
      .order('last_msg_at', { ascending: false })

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  // Mover fase (drag-and-drop kanban)
  app.post<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/phase',
    async (req, reply) => {
      const { to_slug } = req.body as { to_slug: string }
      const { sessionId } = req.params

      const { data: phase } = await db
        .from('conversation_phases')
        .select('id')
        .eq('slug', to_slug)
        .single()

      if (!phase) return reply.code(404).send({ error: 'Phase not found' })

      const { data: current } = await db
        .from('chat_sessions')
        .select('current_phase_id')
        .eq('id', sessionId)
        .single()

      await db
        .from('chat_sessions')
        .update({ current_phase_id: phase.id })
        .eq('id', sessionId)

      await db.from('conversation_phase_transitions').insert({
        session_id: sessionId,
        from_phase_id: current?.current_phase_id ?? null,
        to_phase_id: phase.id,
        actor: 'admin',
        reason: 'manual drag-and-drop',
      })

      return { ok: true }
    }
  )

  // Pausar/retomar Sofia em uma sessão
  app.post<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/pause',
    async (req, reply) => {
      const { paused, admin_id } = req.body as { paused: boolean; admin_id: string }

      await db
        .from('chat_sessions')
        .update({ sofia_paused: paused })
        .eq('id', req.params.sessionId)

      await db.from('admin_interventions').insert({
        session_id: req.params.sessionId,
        admin_id,
        action: paused ? 'pause_sofia' : 'resume_sofia',
      })

      return { ok: true, sofia_paused: paused }
    }
  )

  // Admin enviar mensagem como Sofia
  app.post<{ Params: { sessionId: string } }>(
    '/sessions/:sessionId/message',
    async (req, reply) => {
      const { content, admin_id, bitrix_chat_id } = req.body as {
        content: string
        admin_id: string
        bitrix_chat_id: string
      }

      // Envia no Bitrix
      const { buildBitrixSDKFromEnv } = await import('@sofia/bitrix')
      const sdk = buildBitrixSDKFromEnv()
      await sdk.sendMessage(bitrix_chat_id, content)

      // Persiste como admin_as_sofia
      await db.from('chat_messages').insert({
        session_id: req.params.sessionId,
        role: 'admin_as_sofia',
        content,
      })

      await db.from('admin_interventions').insert({
        session_id: req.params.sessionId,
        admin_id,
        action: 'manual_message',
        content,
      })

      return { ok: true }
    }
  )

  // Feedback em uma mensagem (👍/👎)
  app.post<{ Params: { messageId: string } }>(
    '/messages/:messageId/feedback',
    async (req, reply) => {
      const { feedback } = req.body as { feedback: 'positive' | 'negative' }

      await db
        .from('chat_messages')
        .update({ feedback })
        .eq('id', req.params.messageId)

      return { ok: true }
    }
  )
}
