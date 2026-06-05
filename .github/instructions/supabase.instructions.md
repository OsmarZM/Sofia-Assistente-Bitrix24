---
applyTo: "supabase/migrations/**"
---

# Migrations Supabase — Instruções

## Regras de migrations

1. **Nomear** com prefixo numérico sequencial: `0005_descricao.sql`
2. **Idempotência**: sempre usar `IF NOT EXISTS` / `IF EXISTS` / `CREATE OR REPLACE`
3. **Nunca alterar** migrations já aplicadas — criar nova migration com a correção
4. **SECURITY DEFINER**: só usar quando estritamente necessário (como `search_knowledge_chunks`)
5. **search_path**: toda função PostgreSQL deve ter `SET search_path = public, pg_catalog`
6. **RLS**: ao criar nova tabela, habilitar RLS imediatamente (sem policies = default-deny)

## Checklist para nova migration

```sql
-- ✅ Padrão correto
CREATE TABLE IF NOT EXISTS nova_tabela (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE nova_tabela ENABLE ROW LEVEL SECURITY;

-- ✅ Função correta
CREATE OR REPLACE FUNCTION minha_funcao(...)
RETURNS ...
LANGUAGE plpgsql
SECURITY INVOKER  -- preferir INVOKER; só DEFINER se precisar bypassar RLS
SET search_path = public, pg_catalog
AS $$
BEGIN
  -- ...
END;
$$;
```

## Como aplicar

Via MCP no VS Code (método recomendado):
```
mcp_supabase_apply_migration
```

## Migrations aplicadas

| Arquivo | Descrição |
|---|---|
| `0001_init.sql` | Schema completo (24 tabelas + funções + seed) |
| `0002_search_rpc.sql` | RPC search_knowledge_chunks |
| `0003_security_rls.sql` | RLS em todas as tabelas |
| `0004_function_hardening.sql` | search_path + SECURITY INVOKER |

## Referências

- Histórico completo: `docs/07-banco/migrations.md`
- Skill nova migration: `docs/skills/add-migration.SKILL.md`
- Queries úteis: `docs/07-banco/queries-uteis.md`
