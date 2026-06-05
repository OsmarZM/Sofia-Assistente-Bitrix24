---
applyTo: "apps/api/**"
---

# API Fastify — Instruções

## Stack

- Node.js + Fastify 4 + TypeScript strict + ESM
- `@sofia/db` para Supabase (service_role)
- `@sofia/shared` para crypto, audit, schemas Zod

## Regras obrigatórias

1. **Toda rota de mutação admin** deve chamar `logAudit` ou `logAuditBackground` de `@sofia/shared`.
2. **Validação de input** com Zod: use `schema.parse(req.body)` ou `schema.safeParse`.
3. **Erros Zod**: retornar `400` com `{ error: details }`.
4. **Nunca** expor `ai_providers.config` em respostas — strip sempre.
5. **Nunca** usar `===` para comparar tokens: usar `safeEqual` de `@sofia/shared`.
6. **Rotas webhook**: sempre retornar `200` rapidamente (< 3s), enfileirar job no BullMQ.

## Estrutura de rotas

```
apps/api/src/routes/
├── admin/          # Um arquivo por recurso (documents, chat, providers...)
└── webhooks/       # bitrix.ts
```

## Padrão de rota

```typescript
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { createClient } from '@sofia/db'
import { logAudit } from '@sofia/shared'

const CreateDocumentSchema = z.object({
  title: z.string().min(1),
  category_id: z.string().uuid(),
})

const route: FastifyPluginAsync = async (fastify) => {
  fastify.post('/admin/documents', async (req, reply) => {
    const body = CreateDocumentSchema.parse(req.body)
    const supabase = createClient()
    // ... lógica
    await logAudit({ actor: req.user?.id ?? 'admin', action: 'create', entity: 'documents', entityId: doc.id })
    return reply.code(201).send(doc)
  })
}

export default route
```

## Healthcheck

`GET /health` deve retornar `{ status: 'ok', uptime: process.uptime() }`.

## Referências

- Rotas completas: `docs/03-backend/rotas-api.md`
- Estrutura de pastas: `docs/03-backend/estrutura-pastas.md`
- Skill de nova rota: `docs/skills/add-admin-route.SKILL.md`
