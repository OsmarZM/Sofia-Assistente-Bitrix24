import type { FastifyInstance } from 'fastify'
import { db } from '@sofia/db'
import { getAllCircuitStates } from '@sofia/ai-providers'
import { encryptJSON, decryptJSON, logAudit } from '@sofia/shared'

export async function adminProvidersRoute(app: FastifyInstance) {
  app.get('/providers', async (_, reply) => {
    const { data } = await db
      .from('ai_providers')
      .select('id, name, type, priority, enabled, model_chat, model_embed, ai_provider_health(*)')
      .order('priority', { ascending: true })

    // Enriquece com estado do circuit breaker em memória
    // Remove config cifrada da resposta (nunca expor ao frontend)
    const circuits = getAllCircuitStates()
    return (data ?? []).map((p) => ({
      ...p,
      config: undefined, // nunca expor credenciais cifradas
      circuit_state: circuits.get(p.id)?.state ?? 'closed',
    }))
  })

  app.post('/providers', async (req, reply) => {
    const body = req.body as {
      name: string
      type: string
      config: Record<string, unknown>
      priority: number
      model_chat: string
      model_embed?: string
    }

    // Cifra as credenciais antes de gravar
    const encryptedConfig = encryptJSON(body.config)

    const { data, error } = await db
      .from('ai_providers')
      .insert({ ...body, config: encryptedConfig })
      .select('id, name, type')
      .single()

    if (error) return reply.code(400).send({ error: error.message })

    await logAudit({
      actor: (req as any).user?.id ?? 'admin',
      action: 'create',
      entity: 'ai_providers',
      entityId: data.id,
      before: null,
      after: { name: data.name, type: data.type },
    })

    return { ok: true, id: data.id }
  })

  app.patch('/providers/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const body = req.body as Partial<{
      name: string
      priority: number
      enabled: boolean
      model_chat: string
      model_embed: string
      config: Record<string, unknown>
    }>

    // Snapshot antes da mudança para auditoria
    const { data: before } = await db
      .from('ai_providers')
      .select('name, priority, enabled, model_chat, model_embed')
      .eq('id', id)
      .single()

    const update: Record<string, unknown> = { ...body, updated_at: new Date().toISOString() }
    if (body.config) {
      update['config'] = encryptJSON(body.config)
    }
    delete update['config'] // não re-enviar se não foi passado

    const { error } = await db.from('ai_providers').update(update).eq('id', id)
    if (error) return reply.code(400).send({ error: error.message })

    await logAudit({
      actor: (req as any).user?.id ?? 'admin',
      action: 'update',
      entity: 'ai_providers',
      entityId: id,
      before: before as Record<string, unknown>,
      after: body,
    })

    return { ok: true }
  })

  app.post('/providers/:id/toggle', async (req, reply) => {
    const { id } = req.params as { id: string }
    const { enabled } = req.body as { enabled: boolean }

    await db.from('ai_providers').update({ enabled, updated_at: new Date().toISOString() }).eq('id', id)

    await logAudit({
      actor: (req as any).user?.id ?? 'admin',
      action: enabled ? 'enable' : 'disable',
      entity: 'ai_providers',
      entityId: id,
      after: { enabled },
    })

    return { ok: true }
  })
}
