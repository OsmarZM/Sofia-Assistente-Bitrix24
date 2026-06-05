import type { FastifyInstance } from 'fastify'
import { db } from '@sofia/db'

export async function adminSuggestionsRoute(app: FastifyInstance) {
  app.get('/suggestions', async (req, reply) => {
    const { status = 'pending', limit = '50' } = req.query as Record<string, string>

    const { data, error } = await db
      .from('knowledge_suggestions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(+limit)

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  app.post<{ Params: { id: string } }>('/suggestions/:id/approve', async (req, reply) => {
    const { reviewer_id, comment } = req.body as { reviewer_id: string; comment?: string }
    const { id } = req.params

    await db.from('knowledge_suggestions').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', id)
    await db.from('knowledge_approvals').insert({ suggestion_id: id, reviewer_id, decision: 'approved', comment: comment ?? null })

    return { ok: true }
  })

  app.post<{ Params: { id: string } }>('/suggestions/:id/reject', async (req, reply) => {
    const { reviewer_id, comment } = req.body as { reviewer_id: string; comment?: string }
    const { id } = req.params

    await db.from('knowledge_suggestions').update({ status: 'rejected', updated_at: new Date().toISOString() }).eq('id', id)
    await db.from('knowledge_approvals').insert({ suggestion_id: id, reviewer_id, decision: 'rejected', comment: comment ?? null })

    return { ok: true }
  })
}
