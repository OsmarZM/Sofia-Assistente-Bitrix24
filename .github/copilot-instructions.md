# Sofia Assistente — Copilot Instructions

Você está trabalhando no monorepo **Sofia Assistente**, assistente corporativo de IA da Fortatech Soluções Tecnológicas Ltda.

## Contexto do projeto

Sofia é uma IA integrada ao Bitrix24 que responde perguntas de colaboradores usando RAG (Retrieval-Augmented Generation) sobre a base de conhecimento da empresa.

**Stack principal:**
- TypeScript 5.5 strict + ESM (NodeNext modules)
- pnpm workspaces monorepo
- Backend: Node.js + Fastify (`apps/api`)
- Worker: BullMQ + Redis (`apps/worker`)
- Frontend Admin: Next.js 14 App Router + Tailwind + shadcn/ui (`apps/admin`)
- Banco: Supabase PostgreSQL + pgvector
- IA: OpenAI gpt-4o-mini (primary) + multi-provider fallback

## Regras invioláveis

1. **Acesso ao banco**: Use SEMPRE `service_role` no backend. NUNCA exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend ou client-side.

2. **RLS**: Todas as 24 tabelas têm RLS habilitada (default-deny). O `service_role` bypassa nativamente. Nunca desabilite RLS.

3. **Busca RAG**: Use SEMPRE a RPC `search_knowledge_chunks` — NUNCA SQL direto em `knowledge_chunks`.

4. **Credenciais de providers**: Use `encryptJSON`/`decryptJSON` de `@sofia/shared` para a coluna `ai_providers.config`. NUNCA armazene em plaintext.

5. **Audit log**: Toda mutação em rotas admin DEVE chamar `logAudit` de `@sofia/shared`.

6. **Validação**: Valide inputs com Zod nas bordas do sistema (entrada de rotas HTTP, entrada de jobs BullMQ).

7. **Timing attacks**: Use `safeEqual` de `@sofia/shared` para comparar tokens/segredos — NUNCA `===`.

## Convenções de código

- **UI/mensagens ao usuário**: sempre em **pt-BR**
- **Código, comentários, variáveis**: em **inglês**
- **Commits**: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`)
- **Branches**: `feat/nome`, `fix/nome`, `docs/nome`
- **Imports**: usar alias de workspace `@sofia/api`, `@sofia/shared`, etc.
- **Arquivos de rota Fastify**: um arquivo por recurso em `routes/admin/` ou `routes/webhooks/`

## Estrutura de pacotes

```
packages/
  db/         → cliente Supabase + tipos gerados
  shared/     → crypto, audit, schemas Zod, utils
  rag/        → chunker, retriever, confidence, cache, prompt
  ai-providers/ → ProviderRouter, circuit breaker, custo
  bitrix/     → SDK de envio/recebimento Bitrix24
  ingestion/  → pipeline de ingestão + parsers
```

## Supabase: como fazer queries

```typescript
import { createClient } from '@sofia/db'

const supabase = createClient() // usa SUPABASE_SERVICE_ROLE_KEY

// ✅ Correto — via RPC
const { data } = await supabase.rpc('search_knowledge_chunks', {
  query_embedding: embedding,
  match_threshold: threshold,
  match_count: 5,
})

// ❌ Errado — SQL direto em knowledge_chunks não usa índice RLS corretamente
```

## Como adicionar uma nova rota admin

Ver `docs/skills/add-admin-route.SKILL.md` para o passo a passo.

## Como adicionar um novo provider de IA

Ver `docs/skills/add-ai-provider.SKILL.md`.

## Como criar uma nova migration

Ver `docs/skills/add-migration.SKILL.md`.

## Documentação

A documentação completa está em `docs/`. Use `docs/README.md` como índice.
