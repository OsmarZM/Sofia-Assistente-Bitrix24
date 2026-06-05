import { createWorker } from '../queues.js'
import { db } from '@sofia/db'

// Roda a cada 5 minutos — verifica limites de custo, docs expirando, etc.
export function createAlertWatcherWorker() {
  return createWorker<{ tick: number }>('alert-watcher', async () => {
    const now = new Date().toISOString()
    const alerts: Array<{ type: string; message: string; severity: 'info' | 'warning' | 'critical' }> = []

    // ── 1. Budgets de custo ───────────────────────────────────────────────────
    const { data: budgets } = await db
      .from('cost_budgets')
      .select('period, limit_usd, current_usd, alert_threshold_pct')

    for (const budget of budgets ?? []) {
      const usagePct = (((budget.current_usd as number) ?? 0) / ((budget.limit_usd as number) ?? 1)) * 100
      const threshold = (budget.alert_threshold_pct as number) ?? 80
      if (usagePct >= 100) {
        alerts.push({
          type: 'budget_exceeded',
          message: `Budget ${budget.period} excedido: ${usagePct.toFixed(0)}% (USD ${budget.current_usd}/${budget.limit_usd})`,
          severity: 'critical',
        })
      } else if (usagePct >= threshold) {
        alerts.push({
          type: 'budget_warning',
          message: `Budget ${budget.period} em ${usagePct.toFixed(0)}% (USD ${budget.current_usd}/${budget.limit_usd})`,
          severity: 'warning',
        })
      }
    }

    // ── 2. Documentos expirando em 7 dias ────────────────────────────────────
    const expiryCheck = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: expiringDocs } = await db
      .from('knowledge_documents')
      .select('id, title, expires_at')
      .lte('expires_at', expiryCheck)
      .gt('expires_at', now)
      .eq('status', 'processed')

    for (const doc of expiringDocs ?? []) {
      alerts.push({
        type: 'document_expiring',
        message: `Documento "${doc.title}" expira em ${new Date(doc.expires_at!).toLocaleDateString('pt-BR')}`,
        severity: 'info',
      })
    }

    // ── 3. Sugestões pendentes há mais de 7 dias ──────────────────────────────
    const oldCutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { count: staleSuggestions } = await db
      .from('knowledge_suggestions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending')
      .lt('created_at', oldCutoff)

    if (staleSuggestions && staleSuggestions > 0) {
      alerts.push({
        type: 'stale_suggestions',
        message: `${staleSuggestions} sugestões de conhecimento aguardam revisão há mais de 7 dias`,
        severity: 'warning',
      })
    }

    // ── 4. Taxa de baixa confiança elevada (última hora) ─────────────────────
    const anHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: totalLastHour } = await db
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', anHourAgo)
      .eq('role', 'assistant')

    const { count: lowConfLastHour } = await db
      .from('chat_messages')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', anHourAgo)
      .eq('role', 'assistant')
      .lt('confidence', 0.4)

    if (totalLastHour && totalLastHour >= 10 && lowConfLastHour) {
      const lowPct = (lowConfLastHour / totalLastHour) * 100
      if (lowPct >= 30) {
        alerts.push({
          type: 'low_confidence_spike',
          message: `${lowPct.toFixed(0)}% das respostas na última hora com baixa confiança (${lowConfLastHour}/${totalLastHour})`,
          severity: 'warning',
        })
      }
    }

    // ── Persiste novos alertas (deduplicados por tipo nas últimas 24h) ────────
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: recentAlerts } = await db
      .from('admin_alerts')
      .select('type')
      .gte('created_at', dayAgo)

    const recentTypes = new Set((recentAlerts ?? []).map((a) => a.type))

    for (const alert of alerts) {
      if (!recentTypes.has(alert.type)) {
        await db.from('admin_alerts').insert({
          type: alert.type,
          message: alert.message,
          severity: alert.severity,
        })
      }
    }
  })
}
