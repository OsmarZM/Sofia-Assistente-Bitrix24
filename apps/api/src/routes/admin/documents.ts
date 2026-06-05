import type { FastifyInstance } from 'fastify'
import { db } from '@sofia/db'
import { ingestQueue } from '../../queues.js'

export async function adminDocumentsRoute(app: FastifyInstance) {
  // Lista documentos
  app.get('/documents', async (req, reply) => {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>

    let query = db
      .from('knowledge_documents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((+page - 1) * +limit, +page * +limit - 1)

    if (status) query = query.eq('status', status)

    const { data, error, count } = await query
    if (error) return reply.code(500).send({ error: error.message })

    return { data, total: count, page: +page, limit: +limit }
  })

  // Upload / criar documento (o arquivo já deve estar no Storage)
  app.post('/documents', async (req, reply) => {
    const body = req.body as {
      title: string
      source_type: string
      source_uri?: string
      category_id?: string
      effective_date?: string
      expires_at?: string
      author?: string
    }

    const { data, error } = await db
      .from('knowledge_documents')
      .insert({
        title: body.title,
        source_type: body.source_type as never,
        source_uri: body.source_uri ?? null,
        status: 'uploaded',
        effective_date: body.effective_date ?? null,
        expires_at: body.expires_at ?? null,
        author: body.author ?? null,
      })
      .select('id')
      .single()

    if (error || !data) return reply.code(500).send({ error: error?.message })

    // Enfileira ingestão imediatamente
    await ingestQueue.add('ingest', { documentId: data.id })

    return reply.code(201).send({ id: data.id, status: 'queued' })
  })

  // Re-processar documento
  app.post<{ Params: { id: string } }>('/documents/:id/reprocess', async (req, reply) => {
    const { id } = req.params

    await db
      .from('knowledge_documents')
      .update({ status: 'uploaded', error_msg: null })
      .eq('id', id)

    await ingestQueue.add('ingest', { documentId: id })

    return { ok: true }
  })

  // Deletar (soft-delete: archived)
  app.delete<{ Params: { id: string } }>('/documents/:id', async (req, reply) => {
    await db
      .from('knowledge_documents')
      .update({ status: 'archived', updated_at: new Date().toISOString() })
      .eq('id', req.params.id)

    return { ok: true }
  })
}
