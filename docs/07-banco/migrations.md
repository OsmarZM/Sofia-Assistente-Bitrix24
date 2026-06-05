# Histórico de Migrations

## Objetivo

Documentar cada migration aplicada ao banco de dados.

## Onde fica

`supabase/migrations/` — arquivos SQL aplicados via MCP

---

## Migrations aplicadas

| Arquivo | Status | Data | Descrição |
|---|---|---|---|
| `0001_init.sql` | ✅ Aplicada | 2026-06-05 | Schema completo: 24 tabelas + pgvector + funções + seed |
| `0002_search_rpc.sql` | ✅ Aplicada | 2026-06-05 | RPC `search_knowledge_chunks` |
| `0003_security_rls.sql` | ✅ Aplicada | 2026-06-05 | RLS em todas as 24 tabelas |
| `0004_function_hardening.sql` | ✅ Aplicada | 2026-06-05 | search_path + SECURITY INVOKER em advance_session_phase |

---

## `0001_init.sql`

**Conteúdo**:
- `CREATE EXTENSION IF NOT EXISTS vector`
- 24 tabelas com UUID PKs, timestamps, `deleted_at` soft delete
- Índice IVFFlat em `knowledge_chunks.embedding`
- Função `advance_session_phase()` — move sessão de fase
- Seed: 5 fases kanban, 11 categorias, OpenAI provider, budgets, confidence_calibration

---

## `0002_search_rpc.sql`

**Conteúdo**:
```sql
CREATE OR REPLACE FUNCTION search_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.35,
  match_count int DEFAULT 5,
  p_category_id uuid DEFAULT NULL
) RETURNS TABLE (
  id uuid, document_id uuid, category_id uuid,
  content text, similarity float, source_ref text
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_catalog
```

**Bug corrigido**: referência original usava `kd.category_id` (alias errado); corrigido para `kc.category_id`.

---

## `0003_security_rls.sql`

**Conteúdo**:
```sql
-- Padrão para cada uma das 24 tabelas:
ALTER TABLE <tabela> ENABLE ROW LEVEL SECURITY;
-- Sem policies = default-deny para anon/authenticated
-- service_role bypassa RLS nativamente
```

---

## `0004_function_hardening.sql`

**Conteúdo**:
- `search_knowledge_chunks`: adiciona `SET search_path = public, pg_catalog`
- `advance_session_phase`: muda para `SECURITY INVOKER` + `SET search_path`

---

## Como criar uma nova migration

```bash
# 1. Criar arquivo numerado
touch supabase/migrations/0005_minha_mudanca.sql

# 2. Escrever SQL
# Sempre usar IF NOT EXISTS / IF EXISTS para idempotência

# 3. Aplicar via MCP (método recomendado)
# Use mcp_supabase_apply_migration no VS Code

# 4. Verificar
# Use mcp_supabase_list_migrations para confirmar
```

## Regras de migrations

- **Nunca** alterar migrations já aplicadas — criar nova com fix
- Sempre usar `IF NOT EXISTS` / `IF EXISTS` para idempotência
- Nomear com prefixo numérico: `0005_`, `0006_`, etc.
- Documentar aqui após aplicar

## Troubleshooting de migrations

Ver [docs/09-bugs-e-solucoes/erros-conhecidos.md](../09-bugs-e-solucoes/erros-conhecidos.md) para o problema de DNS/IPv6 com Supabase.
