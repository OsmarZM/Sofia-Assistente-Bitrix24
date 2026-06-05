-- ============================================================
-- Sofia Assistente Virtual — Schema Inicial
-- Migration: 0001_init.sql
-- FONTE ÚNICA DA VERDADE — alterações aqui disparam regen-docs
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- full-text search

-- ─────────────────────────────────────────────────────────────
-- TABELA: users
-- Espelho dos usuários Bitrix24 que interagem com a Sofia
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  bitrix_user_id TEXT       UNIQUE NOT NULL,
  name          TEXT        NOT NULL,
  position      TEXT,
  department    TEXT,
  email         TEXT,
  photo_url     TEXT,
  last_seen     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: knowledge_categories
-- Categorias para organizar a base de conhecimento
-- ─────────────────────────────────────────────────────────────
CREATE TABLE knowledge_categories (
  id         UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT  NOT NULL,
  slug       TEXT  UNIQUE NOT NULL,
  parent_id  UUID  REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: knowledge_documents
-- Arquivos/URLs enviados para a base de conhecimento
-- ─────────────────────────────────────────────────────────────
CREATE TABLE knowledge_documents (
  id               UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_type      TEXT    NOT NULL CHECK (source_type IN ('pdf','docx','pptx','txt','url','manual_qa','csv')),
  source_uri       TEXT,
  title            TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'uploaded'
                           CHECK (status IN ('uploaded','processing','processed','failed','archived')),
  error_msg        TEXT,
  uploaded_by      TEXT,   -- bitrix_user_id ou 'system'
  author           TEXT,
  version          INTEGER NOT NULL DEFAULT 1,
  effective_date   DATE,   -- válido a partir de
  expires_at       DATE,   -- expira em
  review_cycle_days INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: knowledge_chunks
-- Pedaços vetorizados dos documentos (coração do RAG)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE knowledge_chunks (
  id            UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id   UUID    NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  category_id   UUID    REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  content       TEXT    NOT NULL,
  embedding     vector(1536),
  metadata      JSONB   NOT NULL DEFAULT '{}',
  version       INTEGER NOT NULL DEFAULT 1,
  effective_date DATE,
  expires_at    DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: knowledge_manual_qa
-- Pares pergunta/resposta criados manualmente (ingestão rápida)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE knowledge_manual_qa (
  id            UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  question      TEXT  NOT NULL,
  answer        TEXT  NOT NULL,
  category_id   UUID  REFERENCES knowledge_categories(id) ON DELETE SET NULL,
  status        TEXT  NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
  effective_date DATE,
  expires_at    DATE,
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: knowledge_suggestions
-- Loop de aprendizado: sugestões quando a Sofia não soube
-- ─────────────────────────────────────────────────────────────
CREATE TABLE knowledge_suggestions (
  id                UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_question TEXT  NOT NULL,
  sofia_answer      TEXT,
  human_correction  TEXT,
  suggested_by      TEXT  NOT NULL, -- bitrix_user_id
  session_id        UUID,
  message_id        UUID,
  status            TEXT  NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','approved','rejected','archived')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: knowledge_approvals
-- Workflow de revisão de sugestões de conhecimento
-- ─────────────────────────────────────────────────────────────
CREATE TABLE knowledge_approvals (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  suggestion_id  UUID NOT NULL REFERENCES knowledge_suggestions(id) ON DELETE CASCADE,
  reviewer_id    TEXT NOT NULL, -- admin user id
  decision       TEXT NOT NULL CHECK (decision IN ('approved','rejected')),
  comment        TEXT,
  decided_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: ai_providers
-- Registro de providers de IA configurados (multi-provider)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE ai_providers (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT    NOT NULL,
  type        TEXT    NOT NULL CHECK (type IN ('openai','azure_openai','anthropic','grok','gemini')),
  config      JSONB   NOT NULL DEFAULT '{}', -- credenciais (cifradas na aplicação)
  priority    INTEGER NOT NULL DEFAULT 1,    -- menor = maior prioridade
  enabled     BOOLEAN NOT NULL DEFAULT true,
  model_chat  TEXT    NOT NULL,
  model_embed TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: ai_provider_health
-- Estado do circuit breaker por provider
-- ─────────────────────────────────────────────────────────────
CREATE TABLE ai_provider_health (
  provider_id           UUID PRIMARY KEY REFERENCES ai_providers(id) ON DELETE CASCADE,
  last_success          TIMESTAMPTZ,
  last_failure          TIMESTAMPTZ,
  consecutive_failures  INTEGER NOT NULL DEFAULT 0,
  circuit_open_until    TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: ai_pricing
-- Preços históricos para cálculo correto de custo retroativo
-- ─────────────────────────────────────────────────────────────
CREATE TABLE ai_pricing (
  id                          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id                 UUID    NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  model                       TEXT    NOT NULL,
  price_per_1k_input_tokens   NUMERIC(10,6) NOT NULL,
  price_per_1k_output_tokens  NUMERIC(10,6) NOT NULL,
  valid_from                  DATE    NOT NULL DEFAULT CURRENT_DATE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: conversation_phases
-- Colunas configuráveis do kanban de conversas
-- ─────────────────────────────────────────────────────────────
CREATE TABLE conversation_phases (
  id                     UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                   TEXT    NOT NULL,
  slug                   TEXT    UNIQUE NOT NULL,
  "order"                INTEGER NOT NULL,
  color                  TEXT    NOT NULL DEFAULT '#6B7280',
  is_terminal            BOOLEAN NOT NULL DEFAULT false,
  auto_transition_rules  JSONB   NOT NULL DEFAULT '{}',
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: chat_sessions
-- Uma sessão por chat do Bitrix24
-- ─────────────────────────────────────────────────────────────
CREATE TABLE chat_sessions (
  id               UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  bitrix_chat_id   TEXT    UNIQUE NOT NULL,
  bitrix_user_id   TEXT    NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_msg_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  summary          TEXT,
  sentiment        TEXT    CHECK (sentiment IN ('positive','neutral','frustrated','unknown')),
  current_phase_id UUID    REFERENCES conversation_phases(id) ON DELETE SET NULL,
  closed_at        TIMESTAMPTZ,
  closed_reason    TEXT    CHECK (closed_reason IN ('auto_inactivity','manual','escalated')),
  sofia_paused     BOOLEAN NOT NULL DEFAULT false
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: chat_messages
-- Todas as mensagens (usuário, Sofia, admin)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE chat_messages (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id   UUID    NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role         TEXT    NOT NULL CHECK (role IN ('user','sofia','admin_as_sofia','system')),
  content      TEXT    NOT NULL,
  sources      JSONB,
  provider_id  UUID    REFERENCES ai_providers(id) ON DELETE SET NULL,
  model        TEXT,
  tokens_in    INTEGER,
  tokens_out   INTEGER,
  cost_usd     NUMERIC(10,6),
  latency_ms   INTEGER,
  cache_hit    BOOLEAN NOT NULL DEFAULT false,
  confidence   NUMERIC(5,4),
  feedback     TEXT    CHECK (feedback IN ('positive','negative')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: conversation_phase_transitions
-- Auditoria de movimentação no kanban
-- ─────────────────────────────────────────────────────────────
CREATE TABLE conversation_phase_transitions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id    UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  from_phase_id UUID REFERENCES conversation_phases(id) ON DELETE SET NULL,
  to_phase_id   UUID REFERENCES conversation_phases(id) ON DELETE SET NULL,
  reason        TEXT,
  actor         TEXT NOT NULL CHECK (actor IN ('auto','admin','sofia')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: user_profiles
-- Perfil analítico de cada usuário do Bitrix24
-- ─────────────────────────────────────────────────────────────
CREATE TABLE user_profiles (
  bitrix_user_id   TEXT    PRIMARY KEY,
  top_topics       JSONB   NOT NULL DEFAULT '[]',
  knowledge_gaps   JSONB   NOT NULL DEFAULT '[]',
  summary_text     TEXT,
  profile_version  INTEGER NOT NULL DEFAULT 1,
  weekly_digest_at TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: response_cache
-- Cache de respostas para perguntas idênticas (TTL 1h)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE response_cache (
  id             UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  query_hash     TEXT  NOT NULL,
  chunk_ids_hash TEXT  NOT NULL,
  response       TEXT  NOT NULL,
  sources        JSONB,
  provider_used  UUID  REFERENCES ai_providers(id) ON DELETE SET NULL,
  tokens_in      INTEGER,
  tokens_out     INTEGER,
  cost_usd       NUMERIC(10,6),
  expires_at     TIMESTAMPTZ NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (query_hash, chunk_ids_hash)
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: confidence_calibration
-- Singleton — threshold adaptativo do RAG
-- ─────────────────────────────────────────────────────────────
CREATE TABLE confidence_calibration (
  id                    INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  window_size           INTEGER NOT NULL DEFAULT 100,
  current_threshold     NUMERIC(5,4) NOT NULL DEFAULT 0.5,
  confidence_calibrated BOOLEAN NOT NULL DEFAULT false,
  sample_count          INTEGER NOT NULL DEFAULT 0,
  last_updated          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: cost_budgets
-- Limites de gasto diário e mensal
-- ─────────────────────────────────────────────────────────────
CREATE TABLE cost_budgets (
  id                  UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  period              TEXT    NOT NULL CHECK (period IN ('daily','monthly')),
  limit_usd           NUMERIC(10,2) NOT NULL,
  current_usd         NUMERIC(10,2) NOT NULL DEFAULT 0,
  alert_threshold_pct INTEGER NOT NULL DEFAULT 80,
  period_start        DATE    NOT NULL DEFAULT CURRENT_DATE,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (period, period_start)
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: admin_alerts
-- Alertas automáticos gerados pelo sistema
-- ─────────────────────────────────────────────────────────────
CREATE TABLE admin_alerts (
  id               UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  type             TEXT  NOT NULL,
  severity         TEXT  NOT NULL CHECK (severity IN ('info','warning','error','critical')),
  message          TEXT  NOT NULL,
  payload          JSONB,
  acknowledged_by  TEXT,
  acknowledged_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: admin_digest_cards
-- Cards de digest semanal exibidos no painel admin
-- ─────────────────────────────────────────────────────────────
CREATE TABLE admin_digest_cards (
  id             UUID  PRIMARY KEY DEFAULT uuid_generate_v4(),
  period         DATE  NOT NULL,
  scope          TEXT  NOT NULL CHECK (scope IN ('user','global')),
  bitrix_user_id TEXT,
  content        JSONB NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: admin_interventions
-- Registro de intervenções manuais do admin nas conversas
-- ─────────────────────────────────────────────────────────────
CREATE TABLE admin_interventions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  admin_id   TEXT NOT NULL,
  action     TEXT NOT NULL CHECK (action IN ('pause_sofia','resume_sofia','manual_message')),
  content    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: bitrix_events
-- Fila de eventos recebidos do Bitrix24
-- ─────────────────────────────────────────────────────────────
CREATE TABLE bitrix_events (
  id           UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type   TEXT    NOT NULL,
  payload      JSONB   NOT NULL,
  processed    BOOLEAN NOT NULL DEFAULT false,
  error        TEXT,
  attempts     INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: audit_logs
-- Log de auditoria completo do sistema
-- ─────────────────────────────────────────────────────────────
CREATE TABLE audit_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor      TEXT NOT NULL,
  action     TEXT NOT NULL,
  entity     TEXT NOT NULL,
  entity_id  TEXT,
  before     JSONB,
  after      JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- TABELA: chat_messages_archive
-- Mensagens com mais de 365 dias (storage frio)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE chat_messages_archive (LIKE chat_messages INCLUDING ALL);

-- ─────────────────────────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────────────────────────

-- Vetorial (cosine similarity) — requer que a tabela tenha dados para otimizar
CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON knowledge_chunks (document_id);
CREATE INDEX ON knowledge_chunks (category_id);
CREATE INDEX ON knowledge_chunks (expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX ON knowledge_documents (status);
CREATE INDEX ON knowledge_documents (expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX ON knowledge_documents (effective_date) WHERE effective_date IS NOT NULL;

CREATE INDEX ON chat_sessions (bitrix_user_id);
CREATE INDEX ON chat_sessions (current_phase_id);
CREATE INDEX ON chat_sessions (last_msg_at DESC);
CREATE INDEX ON chat_sessions (closed_at) WHERE closed_at IS NULL;

CREATE INDEX ON chat_messages (session_id);
CREATE INDEX ON chat_messages (created_at DESC);
CREATE INDEX ON chat_messages (provider_id);
CREATE INDEX ON chat_messages (feedback) WHERE feedback IS NOT NULL;

CREATE INDEX ON bitrix_events (processed, created_at) WHERE processed = false;
CREATE INDEX ON audit_logs (entity, entity_id);
CREATE INDEX ON audit_logs (created_at DESC);
CREATE INDEX ON response_cache (expires_at);
CREATE INDEX ON response_cache (query_hash);
CREATE INDEX ON admin_alerts (acknowledged_at) WHERE acknowledged_at IS NULL;
CREATE INDEX ON conversation_phase_transitions (session_id);
CREATE INDEX ON knowledge_suggestions (status);

-- ─────────────────────────────────────────────────────────────
-- FUNÇÃO: advance_session_phase
-- Avança a fase de uma sessão apenas se estiver na fase esperada
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION advance_session_phase(
  p_session_id UUID,
  p_from_slug  TEXT,
  p_to_slug    TEXT,
  p_actor      TEXT DEFAULT 'auto',
  p_reason     TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_from_id UUID;
  v_to_id   UUID;
  v_current UUID;
BEGIN
  SELECT id INTO v_from_id FROM conversation_phases WHERE slug = p_from_slug;
  SELECT id INTO v_to_id   FROM conversation_phases WHERE slug = p_to_slug;
  SELECT current_phase_id INTO v_current FROM chat_sessions WHERE id = p_session_id;

  IF v_current = v_from_id OR (v_current IS NULL AND v_from_id IS NOT NULL) THEN
    UPDATE chat_sessions SET current_phase_id = v_to_id WHERE id = p_session_id;
    INSERT INTO conversation_phase_transitions (session_id, from_phase_id, to_phase_id, reason, actor)
    VALUES (p_session_id, v_from_id, v_to_id, p_reason, p_actor);
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- SEED: Dados padrão
-- ─────────────────────────────────────────────────────────────

-- Fases do kanban
INSERT INTO conversation_phases (name, slug, "order", color, is_terminal, auto_transition_rules) VALUES
  ('Nova',              'nova',               1, '#3B82F6', false, '{}'),
  ('Em andamento',      'em-andamento',       2, '#8B5CF6', false, '{}'),
  ('Aguardando humano', 'aguardando-humano',  3, '#F59E0B', false, '{}'),
  ('Resolvida',         'resolvida',          4, '#10B981', true,  '{"inactivity_minutes": 30}'),
  ('Arquivada',         'arquivada',          5, '#6B7280', true,  '{}');

-- Singleton de calibração de confidence
INSERT INTO confidence_calibration (id, window_size, current_threshold, confidence_calibrated, sample_count)
VALUES (1, 100, 0.5, false, 0)
ON CONFLICT (id) DO NOTHING;

-- Categorias padrão de conhecimento
INSERT INTO knowledge_categories (name, slug) VALUES
  ('Produtos',          'produtos'),
  ('Serviços',          'servicos'),
  ('Comercial',         'comercial'),
  ('Suporte',           'suporte'),
  ('FAQ',               'faq'),
  ('Treinamento',       'treinamento'),
  ('Políticas',         'politicas'),
  ('Marketing',         'marketing'),
  ('Financeiro',        'financeiro'),
  ('Jurídico',          'juridico');

-- Provider OpenAI padrão (credencial lida do config em runtime)
INSERT INTO ai_providers (name, type, config, priority, enabled, model_chat, model_embed)
VALUES (
  'OpenAI GPT-4o-mini',
  'openai',
  '{"key_env": "OPENAI_API_KEY"}',
  1,
  true,
  'gpt-4o-mini',
  'text-embedding-3-small'
);

-- Preços OpenAI (Junho 2026 — atualize conforme necessário)
INSERT INTO ai_pricing (provider_id, model, price_per_1k_input_tokens, price_per_1k_output_tokens)
SELECT id, 'gpt-4o-mini', 0.000150, 0.000600 FROM ai_providers WHERE name = 'OpenAI GPT-4o-mini';

INSERT INTO ai_pricing (provider_id, model, price_per_1k_input_tokens, price_per_1k_output_tokens)
SELECT id, 'text-embedding-3-small', 0.000020, 0.000000 FROM ai_providers WHERE name = 'OpenAI GPT-4o-mini';

-- Budgets padrão
INSERT INTO cost_budgets (period, limit_usd, alert_threshold_pct, period_start)
VALUES
  ('daily',   10.00, 80, CURRENT_DATE),
  ('monthly', 200.00, 80, DATE_TRUNC('month', CURRENT_DATE)::DATE);
