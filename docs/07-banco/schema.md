# Schema do Banco de Dados

## Objetivo

Resumo das 24 tabelas com suas responsabilidades.

## Onde fica

- `supabase/migrations/0001_init.sql` — criação completa
- `packages/db/src/types.generated.ts` — tipos TypeScript gerados
- `docs/01-arquitetura/banco-de-dados.md` — ERD completo com Mermaid

---

## Grupos de tabelas

### Usuários e perfis

| Tabela | Descrição |
|---|---|
| `users` | Usuários do Bitrix (sincronizados via webhook) |
| `user_profiles` | Perfil analítico (tópicos, gaps, sentimento, resumo) |

### Base de conhecimento

| Tabela | Descrição |
|---|---|
| `knowledge_categories` | Categorias de documentos (11 no seed) |
| `knowledge_documents` | Documentos ingeridos |
| `knowledge_chunks` | Chunks com embedding `vector(1536)` |
| `knowledge_manual_qa` | Q&A criados manualmente pelo admin |
| `knowledge_suggestions` | Sugestões geradas pela Sofia |
| `knowledge_approvals` | Histórico de aprovações/rejeições |

### Chat e conversas

| Tabela | Descrição |
|---|---|
| `chat_sessions` | Sessão por usuário (fase atual, sofia_paused) |
| `chat_messages` | Todas as mensagens (usuário + Sofia) |
| `chat_messages_archive` | Mensagens arquivadas (por particionamento futuro) |
| `conversation_phases` | Fases configuráveis do kanban |
| `conversation_phase_transitions` | Histórico de movimentos no kanban |

### IA e providers

| Tabela | Descrição |
|---|---|
| `ai_providers` | Configuração de providers (config cifrado AES-256-GCM) |
| `ai_provider_health` | Estado circuit breaker por provider |
| `ai_pricing` | Tabela de preços para cálculo de custo |
| `response_cache` | Cache de respostas (TTL 1h) |
| `confidence_calibration` | Singleton com threshold atual e histórico |

### Admin e operações

| Tabela | Descrição |
|---|---|
| `cost_budgets` | Budgets diário/mensal (seed: $10/$200) |
| `admin_alerts` | Alertas gerados pelo alert-watcher |
| `admin_digest_cards` | Cards do digest semanal |
| `admin_interventions` | Log de intervenções manuais |
| `audit_logs` | Auditoria de todas as mutações admin |

### Integração

| Tabela | Descrição |
|---|---|
| `bitrix_events` | Eventos recebidos do Bitrix24 |

---

## Regras importantes

- Todas as 24 tabelas têm RLS habilitada (default-deny)
- `service_role` é o único role que acessa o banco (via API e Worker)
- `ai_providers.config` é sempre cifrado; nunca expose em respostas da API
- `audit_logs` é append-only; nunca fazer UPDATE ou DELETE nela

## Referências

- ERD completo: [docs/01-arquitetura/banco-de-dados.md](../01-arquitetura/banco-de-dados.md)
- Migrations: [docs/07-banco/migrations.md](migrations.md)
- Queries úteis: [docs/07-banco/queries-uteis.md](queries-uteis.md)
