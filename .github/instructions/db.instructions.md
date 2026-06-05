---
applyTo: "packages/db/**"
---

# DB Package — Instruções

## Propósito

`packages/db` expõe o cliente Supabase configurado e os tipos TypeScript gerados.

## Exports

```typescript
import { createClient } from '@sofia/db'
import type { Database } from '@sofia/db'

const supabase = createClient() // usa SUPABASE_SERVICE_ROLE_KEY
```

## Regras obrigatórias

1. **NUNCA** use `SUPABASE_ANON_KEY` no backend — sempre `service_role`.
2. **`types.generated.ts`** — NUNCA editar manualmente. Sempre regenerar via:
   ```bash
   pnpm --filter @sofia/db generate:types
   ```
3. **Client singleton**: crie o client uma vez por contexto (job ou request), não por operação.

## Regenerar tipos após migration

```bash
# Após aplicar nova migration:
pnpm --filter @sofia/db generate:types
# Commit o arquivo gerado junto com a migration
```

## Configuração

```env
SUPABASE_URL=https://eeswigmlasmblrrvemzw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Referências

- Schema: `docs/07-banco/schema.md`
- Migrations: `docs/07-banco/migrations.md`
- Skill nova migration: `docs/skills/add-migration.SKILL.md`
