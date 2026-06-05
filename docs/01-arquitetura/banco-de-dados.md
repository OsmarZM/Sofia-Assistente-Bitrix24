# Banco de Dados — Arquitetura e ERD

## Objetivo

Documentar o schema completo do banco com relacionamentos entre as 24 tabelas.

## Onde fica

- `supabase/migrations/` — SQL versionado (fonte única da verdade)
- `packages/db/src/types.generated.ts` — tipos TypeScript gerados (não editar manualmente)
- `packages/db/src/client.ts` — client Supabase com service_role

## ERD (Entity-Relationship Diagram)

```mermaid
erDiagram
    users {
        uuid id PK
        text bitrix_user_id UK
        text name
        text position
        text department
    }

    knowledge_categories {
        uuid id PK
        text name
        text slug UK
        uuid parent_id FK
    }

    knowledge_documents {
        uuid id PK
        text source_type
        text title
        text status
        uuid category_id FK
        date effective_date
        date expires_at
    }

    knowledge_chunks {
        uuid id PK
        uuid document_id FK
        uuid category_id FK
        text content
        vector embedding
        jsonb metadata
    }

    knowledge_manual_qa {
        uuid id PK
        text question
        text answer
        uuid category_id FK
        text status
    }

    knowledge_suggestions {
        uuid id PK
        text original_question
        text sofia_answer
        text status
        uuid session_id FK
    }

    knowledge_approvals {
        uuid id PK
        uuid suggestion_id FK
        text reviewer_id
        text decision
    }

    ai_providers {
        uuid id PK
        text name
        text type
        jsonb config
        int priority
        boolean enabled
    }

    ai_provider_health {
        uuid provider_id PK_FK
        int consecutive_failures
        timestamptz circuit_open_until
    }

    ai_pricing {
        uuid id PK
        uuid provider_id FK
        text model
        numeric price_per_1k_input_tokens
        numeric price_per_1k_output_tokens
    }

    conversation_phases {
        uuid id PK
        text name
        text slug UK
        int order
        boolean is_terminal
    }

    chat_sessions {
        uuid id PK
        text bitrix_chat_id UK
        text bitrix_user_id
        uuid current_phase_id FK
        boolean sofia_paused
    }

    chat_messages {
        uuid id PK
        uuid session_id FK
        text role
        text content
        uuid provider_id FK
        numeric cost_usd
        numeric confidence
        text feedback
    }

    conversation_phase_transitions {
        uuid id PK
        uuid session_id FK
        uuid from_phase_id FK
        uuid to_phase_id FK
        text actor
    }

    user_profiles {
        text bitrix_user_id PK
        jsonb top_topics
        jsonb knowledge_gaps
        text summary_text
    }

    response_cache {
        uuid id PK
        text query_hash
        text chunk_ids_hash
        text response
        timestamptz expires_at
    }

    confidence_calibration {
        int id PK
        numeric current_threshold
        int sample_count
        boolean confidence_calibrated
    }

    cost_budgets {
        uuid id PK
        text period
        numeric limit_usd
        numeric current_usd
        int alert_threshold_pct
    }

    admin_alerts {
        uuid id PK
        text type
        text severity
        text message
        timestamptz acknowledged_at
    }

    admin_interventions {
        uuid id PK
        uuid session_id FK
        text admin_id
        text action
    }

    bitrix_events {
        uuid id PK
        text event_type
        jsonb payload
        boolean processed
    }

    audit_logs {
        uuid id PK
        text actor
        text action
        text entity
        jsonb before
        jsonb after
    }

    knowledge_documents ||--o{ knowledge_chunks : "tem"
    knowledge_categories ||--o{ knowledge_documents : "categoriza"
    knowledge_categories ||--o{ knowledge_chunks : "categoriza"
    knowledge_categories ||--o{ knowledge_manual_qa : "categoriza"
    knowledge_categories ||--o| knowledge_categories : "parent"
    knowledge_suggestions ||--o{ knowledge_approvals : "tem"
    ai_providers ||--|| ai_provider_health : "tem saúde"
    ai_providers ||--o{ ai_pricing : "tem preços"
    ai_providers ||--o{ chat_messages : "usou"
    conversation_phases ||--o{ chat_sessions : "fase atual"
    chat_sessions ||--o{ chat_messages : "tem"
    chat_sessions ||--o{ conversation_phase_transitions : "transições"
    chat_sessions ||--o{ admin_interventions : "intervenções"
    conversation_phases ||--o{ conversation_phase_transitions : "de"
    knowledge_suggestions }o--|| chat_sessions : "originou"
```

## Migrations aplicadas

| Migration | Objetivo |
|---|---|
| [0001_init.sql](../../supabase/migrations/0001_init.sql) | Schema completo: 24 tabelas + índices + seed data |
| [0002_search_rpc.sql](../../supabase/migrations/0002_search_rpc.sql) | Função `search_knowledge_chunks` (pgvector RPC) |
| [0003_security_rls.sql](../../supabase/migrations/0003_security_rls.sql) | RLS habilitada em todas as 24 tabelas |
| [0004_function_hardening.sql](../../supabase/migrations/0004_function_hardening.sql) | `search_path` fixo + `SECURITY INVOKER` em funções |

## Regras importantes

- **Nunca editar** `packages/db/src/types.generated.ts` manualmente
- **Toda nova tabela** deve ter `ENABLE ROW LEVEL SECURITY` no mesmo arquivo de migration
- **Toda nova função** deve ter `SET search_path = public, pg_catalog`
- `ai_providers.config` sempre cifrado com AES-256-GCM antes de gravar

## Histórico de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-06-05 | Supabase + pgvector (não Pinecone/Weaviate) | Tudo num único serviço; sem vendor extra; ótima integração |
| 2026-06-05 | IVFFlat com lists=100 | Bom equilíbrio entre velocidade e precisão para o volume esperado |
| 2026-06-05 | Tabela `chat_messages_archive` (fria) | Mantém tabela quente leve após 365 dias |
| 2026-06-05 | `confidence_calibration` como singleton (id=1) | Um único threshold global; simplifica MVP |
