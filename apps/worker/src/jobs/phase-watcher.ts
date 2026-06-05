import { createWorker } from '../queues.js'
import { db } from '@sofia/db'

// Roda como cron de 1 em 1 minuto (agendado pelo index.ts)
// Verifica sessões inativas e as move para "Resolvida"
export function createPhaseWatcherWorker() {
  return createWorker<{ tick: number }>('phase-watcher', async () => {
    // Busca a fase "Resolvida" e suas regras de auto-transição
    const { data: phases } = await db
      .from('conversation_phases')
      .select('id, slug, auto_transition_rules')
      .not('auto_transition_rules', 'is', null)

    if (!phases) return

    for (const phase of phases) {
      const rules = phase.auto_transition_rules as {
        inactivity_minutes?: number
        target_slug?: string
      } | null

      if (!rules?.inactivity_minutes || !rules?.target_slug) continue

      const cutoff = new Date(
        Date.now() - rules.inactivity_minutes * 60 * 1000
      ).toISOString()

      // Sessões nesta fase sem atividade desde o cutoff
      const { data: staleSessions } = await db
        .from('chat_sessions')
        .select('id, current_phase_id')
        .eq('current_phase_id', phase.id)
        .lt('last_msg_at', cutoff)
        .is('closed_at', null)

      if (!staleSessions?.length) continue

      // Busca a fase destino
      const { data: targetPhase } = await db
        .from('conversation_phases')
        .select('id')
        .eq('slug', rules.target_slug)
        .single()

      if (!targetPhase) continue

      for (const session of staleSessions) {
        await db
          .from('chat_sessions')
          .update({ current_phase_id: targetPhase.id })
          .eq('id', session.id)

        await db.from('conversation_phase_transitions').insert({
          session_id: session.id,
          from_phase_id: session.current_phase_id,
          to_phase_id: targetPhase.id,
          actor: 'system',
          reason: `inactivity > ${rules.inactivity_minutes}min`,
        })
      }
    }
  })
}
