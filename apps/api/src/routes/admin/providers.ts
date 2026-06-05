import type { FastifyInstance } from 'fastify'
import { db } from '@sofia/db'
import { getAllCircuitStates } from '@sofia/ai-providers'

export async function adminProvidersRoute(app: FastifyInstance) {
  app.get('/providers', async (_, reply) => {
    const { data } = await db
      .from('ai_providers')
      .select('id, name, type, priority, enabled, model_chat, model_embed, ai_provider_health(*)')
      .order('priority', { ascending: true })

    // Enriquece com estado do circuit breaker em memória
    const circuits = getAllCircuitStates()
    return (data ?? []).map((p) => ({
      ...p,
      circuit_state: circuits.get(p.id)?.state ?? 'closed',
    }))
  })

  app.post('/providers/:id/toggle', async (req, reply) => {
    const { enabled } = req.body as { enabled: boolean }
    await db.from('ai_providers').update({ enabled, updated_at: new Date().toISOString() }).eq('id', (req.params as { id: string }).id)
    return { ok: true }
  })
}
