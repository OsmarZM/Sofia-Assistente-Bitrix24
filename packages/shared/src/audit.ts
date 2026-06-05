/**
 * audit.ts — Helper centralizado para gravação em audit_logs.
 *
 * Regra: toda mutação administrativa (criar documento, aprovar sugestão,
 * intervenção em sessão, alterar provider/threshold) deve chamar logAudit.
 * Erros de auditoria são silenciosos (não bloqueiam a operação principal),
 * mas logados no console como warning.
 */
import { db } from '@sofia/db'

export interface AuditEntry {
  actor: string              // bitrix_user_id, 'system', 'admin:<id>'
  action: string             // create | update | delete | approve | reject | pause | resume | toggle
  entity: string             // nome da tabela / entidade (ex: 'knowledge_documents')
  entityId?: string          // UUID da entidade afetada
  before?: Record<string, unknown> | null  // snapshot antes da mudança (null para create)
  after?: Record<string, unknown> | null   // snapshot após a mudança (null para delete)
}

/**
 * Grava uma entrada em audit_logs de forma não-bloqueante.
 * Nunca lança exceção — erros são logados como warning.
 */
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.from('audit_logs').insert({
      actor: entry.actor,
      action: entry.action,
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      before: entry.before ?? null,
      after: entry.after ?? null,
    })
  } catch (err) {
    console.warn('[audit] Falha ao gravar log de auditoria:', err)
  }
}

/**
 * Versão síncrona que enfileira sem await.
 * Use quando o contexto não permite async (ex: middleware de route).
 */
export function logAuditBackground(entry: AuditEntry): void {
  logAudit(entry).catch((err) => {
    console.warn('[audit] Falha ao gravar log de auditoria (background):', err)
  })
}
