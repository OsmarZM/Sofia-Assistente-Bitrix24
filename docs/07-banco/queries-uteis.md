# Queries Úteis

## Objetivo

Queries SQL comuns para operação e diagnóstico do banco Sofia.

> Rodar via Supabase Dashboard → SQL Editor ou `psql`.

---

## Diagnóstico geral

```sql
-- Quantos chunks por categoria
SELECT kc.name, COUNT(ch.id) as chunks
FROM knowledge_chunks ch
JOIN knowledge_categories kc ON kc.id = ch.category_id
WHERE ch.deleted_at IS NULL
GROUP BY kc.name
ORDER BY chunks DESC;

-- Documentos por status
SELECT status, COUNT(*) FROM knowledge_documents GROUP BY status;

-- Custo total por dia (últimos 30 dias)
SELECT
  DATE_TRUNC('day', created_at) as dia,
  SUM(total_cost_usd)::numeric(10,6) as custo
FROM chat_messages
WHERE role = 'assistant' AND created_at > NOW() - INTERVAL '30 days'
GROUP BY dia
ORDER BY dia;
```

---

## Conversas e sessões

```sql
-- Sessões ativas por fase
SELECT cp.name, COUNT(cs.id) as sessoes
FROM chat_sessions cs
JOIN conversation_phases cp ON cp.id = cs.current_phase_id
WHERE cs.deleted_at IS NULL
GROUP BY cp.name, cp.order_index
ORDER BY cp.order_index;

-- Últimas 10 mensagens de uma sessão
SELECT role, content, confidence, created_at
FROM chat_messages
WHERE session_id = '<SESSION_ID>'
ORDER BY created_at DESC
LIMIT 10;
```

---

## Audit log

```sql
-- Últimas 20 ações admin
SELECT actor, action, entity, entity_id, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT 20;

-- Quem aprovou sugestões hoje
SELECT actor, entity_id, after, created_at
FROM audit_logs
WHERE action = 'approve' AND entity = 'knowledge_suggestions'
  AND created_at > NOW() - INTERVAL '1 day';
```

---

## Confidence e calibração

```sql
-- Estado atual da calibração
SELECT current_threshold, precision_at_threshold, recall_at_threshold,
       sample_count, confidence_calibrated, last_calibrated_at
FROM confidence_calibration
LIMIT 1;

-- Distribuição de confidence nas últimas 100 msgs da Sofia
SELECT
  ROUND(confidence::numeric, 1) as bucket,
  COUNT(*) as count
FROM chat_messages
WHERE role = 'assistant'
ORDER BY created_at DESC
LIMIT 100;
-- Subquery para GROUP BY:
```

---

## Circuit breaker

```sql
-- Estado dos providers
SELECT p.name, h.success_count, h.failure_count,
       h.circuit_open_until, h.updated_at
FROM ai_providers p
JOIN ai_provider_health h ON h.provider_id = p.id
ORDER BY p.priority;
```

---

## Alertas não reconhecidos

```sql
SELECT type, message, metadata, created_at
FROM admin_alerts
WHERE acknowledged = false
ORDER BY created_at DESC;
```

---

## Manutenção

```sql
-- Limpar cache expirado
DELETE FROM response_cache WHERE expires_at < NOW();

-- Ver documentos expirando em 7 dias
SELECT title, expires_at
FROM knowledge_documents
WHERE expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days'
  AND deleted_at IS NULL;
```
