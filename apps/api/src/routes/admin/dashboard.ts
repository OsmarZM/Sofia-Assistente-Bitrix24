import type { FastifyInstance } from 'fastify'
import { db } from '@sofia/db'

export async function adminDashboardRoute(app: FastifyInstance) {
  // Métricas principais para o dashboard
  app.get('/dashboard/metrics', async (req, reply) => {
    const { period = '7d' } = req.query as Record<string, string>
    const days = period === '30d' ? 30 : period === '1d' ? 1 : 7
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    const todayStart = new Date().toISOString().slice(0, 10) + 'T00:00:00Z'

    const [
      totalMessages,
      todayMessages,
      activeSessions,
      pendingSuggestions,
      costs,
      budgets,
      noAnswerCount,
      alerts,
    ] = await Promise.all([
      db.from('chat_messages').select('id', { count: 'exact', head: true }).gte('created_at', since),
      db.from('chat_messages').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
      db.from('chat_sessions').select('id', { count: 'exact', head: true }).is('closed_at', null),
      db.from('knowledge_suggestions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      db
        .from('chat_messages')
        .select('cost_usd, tokens_in, tokens_out, cache_hit, provider_id, created_at')
        .gte('created_at', since)
        .not('cost_usd', 'is', null),
      db.from('cost_budgets').select('period, limit_usd, current_usd, alert_threshold_pct'),
      db
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', since)
        .lt('confidence', 0.5),
      db
        .from('admin_alerts')
        .select('*')
        .is('acknowledged_at', null)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const costData = costs.data ?? []
    const totalCostUsd = costData.reduce((s, m) => s + (m.cost_usd ?? 0), 0)
    const totalTokensIn = costData.reduce((s, m) => s + (m.tokens_in ?? 0), 0)
    const totalTokensOut = costData.reduce((s, m) => s + (m.tokens_out ?? 0), 0)
    const cacheHits = costData.filter((m) => m.cache_hit).length
    const cacheHitRate = costData.length > 0 ? (cacheHits / costData.length) * 100 : 0

    const total = totalMessages.count ?? 0
    const noAnswer = noAnswerCount.count ?? 0
    const answerRate = total > 0 ? ((total - noAnswer) / total) * 100 : 0

    return {
      period,
      messages: { total, today: todayMessages.count ?? 0 },
      sessions: { active: activeSessions.count ?? 0 },
      suggestions: { pending: pendingSuggestions.count ?? 0 },
      cost: {
        usd: Number(totalCostUsd.toFixed(4)),
        tokensIn: totalTokensIn,
        tokensOut: totalTokensOut,
      },
      cache: { hitRate: Number(cacheHitRate.toFixed(1)), hits: cacheHits },
      quality: {
        answerRate: Number(answerRate.toFixed(1)),
        noAnswerCount: noAnswer,
      },
      budgets: budgets.data ?? [],
      alerts: alerts.data ?? [],
    }
  })

  // Dados para gráficos (série temporal de custo/tokens por dia)
  app.get('/dashboard/cost-chart', async (req, reply) => {
    const { days = '7' } = req.query as Record<string, string>
    const since = new Date(Date.now() - +days * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await db
      .from('chat_messages')
      .select('cost_usd, tokens_in, tokens_out, created_at, provider_id')
      .gte('created_at', since)
      .order('created_at', { ascending: true })

    if (error) return reply.code(500).send({ error: error.message })

    // Agrupa por dia
    type DayBucket = { date: string; costUsd: number; tokensIn: number; tokensOut: number }
    const byDay = new Map<string, DayBucket>()

    for (const msg of data ?? []) {
      const day = msg.created_at.slice(0, 10)
      const bucket = byDay.get(day) ?? { date: day, costUsd: 0, tokensIn: 0, tokensOut: 0 }
      bucket.costUsd += msg.cost_usd ?? 0
      bucket.tokensIn += msg.tokens_in ?? 0
      bucket.tokensOut += msg.tokens_out ?? 0
      byDay.set(day, bucket)
    }

    return Array.from(byDay.values()).map((b) => ({
      ...b,
      costUsd: Number(b.costUsd.toFixed(4)),
    }))
  })

  // Cards de digest semanal
  app.get('/dashboard/digest', async (_, reply) => {
    const { data } = await db
      .from('admin_digest_cards')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    return data ?? []
  })

  // Acknowledger alertas
  app.post<{ Params: { alertId: string } }>(
    '/alerts/:alertId/acknowledge',
    async (req, reply) => {
      const { admin_id } = req.body as { admin_id: string }
      await db
        .from('admin_alerts')
        .update({ acknowledged_by: admin_id, acknowledged_at: new Date().toISOString() })
        .eq('id', req.params.alertId)
      return { ok: true }
    }
  )
}
