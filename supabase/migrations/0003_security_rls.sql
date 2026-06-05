-- ============================================================
-- Migration: 0003_security_rls.sql
-- Objetivo: Habilitar Row Level Security (RLS) em todas as
--           24 tabelas públicas do schema Sofia.
--
-- Estratégia: default-deny para roles anon/authenticated.
--   • service_role bypassa RLS nativamente (API + Worker).
--   • Admin Next.js consome APENAS a API Fastify, que usa
--     service_role internamente — nunca chama Supabase direto.
--   • Sem policies explícitas = nenhuma linha acessível via
--     anon, o que é o comportamento correto para single-tenant.
-- ============================================================

-- ── Conhecimento ─────────────────────────────────────────
ALTER TABLE knowledge_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_manual_qa        ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_suggestions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_approvals        ENABLE ROW LEVEL SECURITY;

-- ── IA e Providers ───────────────────────────────────────
ALTER TABLE ai_providers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_health         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_pricing                 ENABLE ROW LEVEL SECURITY;

-- ── Conversas e Kanban ───────────────────────────────────
ALTER TABLE conversation_phases        ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_phase_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages              ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages_archive      ENABLE ROW LEVEL SECURITY;

-- ── Usuários ─────────────────────────────────────────────
ALTER TABLE users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles              ENABLE ROW LEVEL SECURITY;

-- ── Cache e Calibração ───────────────────────────────────
ALTER TABLE response_cache             ENABLE ROW LEVEL SECURITY;
ALTER TABLE confidence_calibration     ENABLE ROW LEVEL SECURITY;

-- ── Observabilidade / Admin ──────────────────────────────
ALTER TABLE cost_budgets               ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_alerts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_digest_cards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_interventions        ENABLE ROW LEVEL SECURITY;

-- ── Sistema ──────────────────────────────────────────────
ALTER TABLE bitrix_events              ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs                 ENABLE ROW LEVEL SECURITY;
