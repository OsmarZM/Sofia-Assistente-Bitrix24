---
applyTo: "apps/worker/**"
---

# Worker BullMQ — Instruções

## Stack

- Node.js + BullMQ + TypeScript strict + ESM
- `@sofia/db` para Supabase (service_role)
- `@sofia/rag` para RAG pipeline
- `@sofia/bitrix` para enviar mensagens

## Jobs existentes

| Arquivo | Fila | Descrição |
|---|---|---|
| `bitrix-message.ts` | `bitrix-message` | Pipeline completo de resposta (18 passos) |
| `ingest.ts` | `ingest` | Parse + chunk + embed + insert |
| `profile-update.ts` | `profile-update` | Perfil analítico com decay exponencial |
| `phase-watcher.ts` | `phase-watcher` | Cron: auto-transição kanban |
| `alert-watcher.ts` | `alert-watcher` | Cron: alertas automáticos |
| `recalibrate-threshold.ts` | `recalibrate-threshold` | Calibração adaptativa |

## Regras obrigatórias

1. **Validação**: Valide o `job.data` com Zod no início de cada job.
2. **Idempotência**: Jobs devem ser re-executáveis sem efeitos colaterais duplicados.
3. **Erros**: Lance `Error` com mensagem descritiva — BullMQ fará retry com backoff.
4. **Timeout**: Defina `timeout` no worker (padrão: 30s para `bitrix-message`).
5. **Logs**: Use `fastify.log` ou `console.error` — NUNCA imprima credenciais ou API keys.

## Padrão de job

```typescript
import { Worker, Job } from 'bullmq'
import { z } from 'zod'

const DataSchema = z.object({ eventId: z.string().uuid() })

export function createBitrixMessageWorker(connection: RedisOptions) {
  return new Worker('bitrix-message', async (job: Job) => {
    const { eventId } = DataSchema.parse(job.data)
    // ... lógica do job
  }, { connection, concurrency: 5, limiter: { max: 10, duration: 1000 } })
}
```

## Referências

- Filas completas: `docs/01-arquitetura/filas-workers.md`
- Estrutura de pastas: `docs/03-backend/estrutura-pastas.md`
