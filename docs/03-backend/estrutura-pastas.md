# Estrutura de Pastas — Backend

## Objetivo

Mapear os diretórios e arquivos do backend (API + Worker + packages).

## Onde fica

```
apps/api/src/
├── server.ts              # Fastify app bootstrap + plugins
├── queues.ts              # Instâncias BullMQ (bitrixMessageQueue, ingestQueue...)
├── routes/
│   ├── admin/
│   │   ├── documents.ts   # CRUD documentos + upload
│   │   ├── chat.ts        # Histórico de conversas + sessões
│   │   ├── dashboard.ts   # Métricas agregadas
│   │   ├── suggestions.ts # Aprovar/rejeitar sugestões
│   │   ├── providers.ts   # CRUD providers IA (com cifra)
│   │   └── users.ts       # Perfis de usuários
│   └── webhooks/
│       └── bitrix.ts      # Recebe eventos do Bitrix24

apps/worker/src/
├── index.ts               # Registra todos os workers
└── jobs/
    ├── bitrix-message.ts  # Pipeline completo de resposta (18 passos)
    ├── ingest.ts          # Parse + chunk + embed + insert
    ├── profile-update.ts  # Perfil analítico com decay exponencial
    ├── phase-watcher.ts   # Cron: auto-transição kanban
    ├── alert-watcher.ts   # Cron: alertas automáticos
    └── recalibrate-threshold.ts # Calibração adaptativa

packages/
├── db/src/
│   ├── client.ts          # createClient com service_role
│   └── types.generated.ts # Tipos TS gerados (não editar)
│
├── rag/src/
│   ├── chunker.ts         # Chunking híbrido
│   ├── retriever.ts       # Busca pgvector via RPC
│   ├── prompt.ts          # Persona Sofia + template
│   ├── confidence.ts      # Score + calibração adaptativa
│   └── cache.ts           # Cache por hash (TTL 1h)
│
├── ai-providers/src/
│   ├── index.ts           # Exports públicos
│   ├── router.ts          # ProviderRouter + failover
│   ├── circuit-breaker.ts # Circuit breaker + estado em memória
│   ├── cost-meter.ts      # Cálculo de custo via ai_pricing
│   ├── registry.ts        # Lê ai_providers + decifra config
│   └── providers/
│       ├── openai.ts
│       ├── azure.ts
│       ├── anthropic.ts
│       ├── grok.ts
│       └── gemini.ts
│
├── bitrix/src/
│   └── sdk.ts             # sendMessage, getUserInfo, isSofia
│
├── ingestion/src/
│   ├── pipeline.ts        # Orquestra parse → chunk → embed → insert
│   └── parsers/
│       ├── pdf.ts
│       ├── docx.ts
│       ├── pptx.ts
│       ├── url.ts         # cheerio + readability (+ Playwright flag)
│       └── txt.ts
│
└── shared/src/
    ├── schemas.ts         # Schemas Zod (fonte única de tipos cross-package)
    ├── utils.ts           # Utilitários gerais
    ├── crypto.ts          # AES-256-GCM encryptJSON/decryptJSON/safeEqual
    └── audit.ts           # logAudit / logAuditBackground
```

## Regras importantes

- `packages/db/src/types.generated.ts` — **nunca editar manualmente**
- `packages/shared/src/schemas.ts` — fonte única de tipos compartilhados
- Toda rota admin de mutação deve chamar `logAudit`
- Toda operação com credenciais de provider usa `encryptJSON`/`decryptJSON`

## Histórico de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-06-05 | `packages/shared` centraliza crypto e audit | Evita duplicação entre API e Worker |
| 2026-06-05 | `ai-providers` separado do `rag` | Permite testar providers sem depender do chunker |
