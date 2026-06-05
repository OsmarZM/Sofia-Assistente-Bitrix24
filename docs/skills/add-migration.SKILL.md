---
description: "Guia passo a passo para criar uma nova migration Supabase no projeto Sofia. Use sempre que precisar alterar o schema do banco."
---

# Skill: Criar Nova Migration

## Quando usar

Sempre que precisar:
- Criar uma nova tabela
- Adicionar/remover colunas
- Criar ou alterar funções PostgreSQL
- Adicionar índices
- Inserir dados de seed

## Regras fundamentais

- **NUNCA** alterar migrations já aplicadas — criar nova migration com a correção
- **SEMPRE** usar `IF NOT EXISTS` / `IF EXISTS` para idempotência
- **SEMPRE** habilitar RLS em novas tabelas
- **SEMPRE** definir `SET search_path = public, pg_catalog` em novas funções

## Passo a passo

### 1. Criar o arquivo

```bash
# Próximo número disponível (ver docs/07-banco/migrations.md)
# Exemplo: migration 0005
```

Nome do arquivo: `supabase/migrations/0005_descricao_clara.sql`

### 2. Escrever o SQL

```sql
-- supabase/migrations/0005_add_feedback_table.sql
-- Tabela de feedback explícito dos usuários

CREATE TABLE IF NOT EXISTS user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  rating SMALLINT NOT NULL CHECK (rating IN (-1, 1)),  -- -1 👎, +1 👍
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para queries por message
CREATE INDEX IF NOT EXISTS user_feedback_message_id_idx ON user_feedback(message_id);

-- RLS obrigatório
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
-- Sem policies = service_role only (default-deny para anon)
```

### 3. Aplicar via MCP

No VS Code, usando a ferramenta MCP Supabase:

```
mcp_supabase_apply_migration
  name: "0005_add_feedback_table"
  query: <conteúdo do arquivo SQL>
```

### 4. Verificar

```
mcp_supabase_list_migrations
```

Confirmar que `0005_add_feedback_table` aparece na lista.

### 5. Regenerar tipos TypeScript

```bash
pnpm --filter @sofia/db generate:types
```

### 6. Committar

```bash
git add supabase/migrations/0005_add_feedback_table.sql
git add packages/db/src/types.generated.ts
git commit -m "feat(db): adiciona tabela user_feedback"
```

### 7. Documentar

Adicionar entrada na tabela em `docs/07-banco/migrations.md`.

### Checklist

- [ ] Arquivo nomeado com prefixo numérico sequencial
- [ ] SQL usa `IF NOT EXISTS` / `IF EXISTS`
- [ ] RLS habilitado em novas tabelas
- [ ] `SET search_path` em novas funções
- [ ] Aplicado via MCP
- [ ] Verificado via `mcp_supabase_list_migrations`
- [ ] Tipos TypeScript regenerados
- [ ] Documentado em `docs/07-banco/migrations.md`
- [ ] Commitado junto com os tipos gerados

## Referências

- Histórico de migrations: `docs/07-banco/migrations.md`
- Schema do banco: `docs/07-banco/schema.md`
- Exemplos: `supabase/migrations/`
