-- ============================================================
-- Migration: 0004_function_hardening.sql
-- Objetivo: Fixar search_path em funções para evitar
--           SQL injection via "search_path hijacking" e
--           ajustar SECURITY context ao mínimo necessário.
--
-- Decisões:
--   • search_knowledge_chunks: mantém SECURITY DEFINER porque
--     precisa atravessar o RLS de knowledge_chunks e
--     knowledge_documents quando chamado por roles sem acesso
--     direto. Mitigado fixando search_path.
--   • advance_session_phase: troca para SECURITY INVOKER porque
--     é chamada exclusivamente pelo service_role (API/Worker),
--     que já tem acesso total às tabelas.
-- ============================================================

-- ── search_knowledge_chunks ──────────────────────────────
-- Mantém SECURITY DEFINER (necessário para RLS bypass em RAG).
-- Fixa search_path para eliminar vetor de ataque de hijacking.
ALTER FUNCTION search_knowledge_chunks(
  vector(1536), float4, int, uuid
) SET search_path = public, pg_catalog;

-- ── advance_session_phase ────────────────────────────────
-- Troca para SECURITY INVOKER (caller = service_role, que tem
-- acesso pleno). Fixa search_path como boa prática.
CREATE OR REPLACE FUNCTION advance_session_phase(
  p_session_id UUID,
  p_from_slug  TEXT,
  p_to_slug    TEXT,
  p_actor      TEXT DEFAULT 'auto',
  p_reason     TEXT DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_catalog
AS $$
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
