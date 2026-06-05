---
description: "Guia passo a passo para adicionar uma nova rota admin no backend Fastify da Sofia. Use quando precisar criar um novo endpoint em apps/api/src/routes/admin/."
---

# Skill: Adicionar Rota Admin

## Quando usar

Quando precisar criar um novo endpoint em `apps/api/src/routes/admin/`.

## Passo a passo

### 1. Criar o arquivo de rota

```bash
# Exemplo: nova rota para gerenciar alertas customizados
apps/api/src/routes/admin/custom-alerts.ts
```

### 2. Estrutura básica da rota

```typescript
import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { createClient } from '@sofia/db'
import { logAudit } from '@sofia/shared'

// Schema de validação Zod
const CreateAlertSchema = z.object({
  message: z.string().min(1).max(500),
  type: z.enum(['cost', 'confidence', 'provider']),
})

const customAlertsRoute: FastifyPluginAsync = async (fastify) => {
  const supabase = createClient()

  // GET — listar
  fastify.get('/admin/custom-alerts', async (req, reply) => {
    const { data, error } = await supabase
      .from('admin_alerts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return reply.code(500).send({ error: error.message })
    return data
  })

  // POST — criar (com audit log)
  fastify.post('/admin/custom-alerts', async (req, reply) => {
    const body = CreateAlertSchema.parse(req.body)

    const { data, error } = await supabase
      .from('admin_alerts')
      .insert(body)
      .select()
      .single()

    if (error) return reply.code(500).send({ error: error.message })

    await logAudit({
      actor: (req as any).user?.id ?? 'admin',
      action: 'create',
      entity: 'admin_alerts',
      entityId: data.id,
      after: body,
    })

    return reply.code(201).send(data)
  })
}

export default customAlertsRoute
```

### 3. Registrar a rota no server

Em `apps/api/src/server.ts`:

```typescript
import customAlertsRoute from './routes/admin/custom-alerts.js'

// Dentro do bootstrap da aplicação:
fastify.register(customAlertsRoute)
```

### 4. Validação de erros Zod

```typescript
// Adicionar handler global (já deve existir no server.ts):
fastify.setErrorHandler((error, req, reply) => {
  if (error instanceof z.ZodError) {
    return reply.code(400).send({ error: 'Validation error', details: error.errors })
  }
  return reply.code(500).send({ error: error.message })
})
```

### 5. Checklist

- [ ] Arquivo criado em `routes/admin/`
- [ ] Schema Zod definido para todos os inputs
- [ ] `logAudit` chamado em POST, PATCH, DELETE
- [ ] Erros do Supabase tratados (retornar 500)
- [ ] Rota registrada no `server.ts`
- [ ] Documentar em `docs/03-backend/rotas-api.md`
- [ ] Testar com `curl` ou REST Client

## Referências

- Rotas existentes: `apps/api/src/routes/admin/`
- Documentação de rotas: `docs/03-backend/rotas-api.md`
- Audit log API: `packages/shared/src/audit.ts`
