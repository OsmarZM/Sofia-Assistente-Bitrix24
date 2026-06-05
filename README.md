<div align="center">

# Sofia — Assistente Virtual Fortatech

**Funcionária digital no Bitrix24, movida por RAG sobre Supabase pgvector**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?logo=supabase)](https://supabase.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](https://nextjs.org/)
[![pnpm](https://img.shields.io/badge/pnpm-workspaces-F69220?logo=pnpm)](https://pnpm.io/)

</div>

---

## O que é a Sofia?

A Sofia é uma **funcionária virtual real do Bitrix24** (não um bot) que responde perguntas dos colaboradores da Fortatech usando uma base de conhecimento proprietária. Ela aprende com documentos internos (PDF, DOCX, PPTX, URLs, Q&A manual), melhora com feedback humano e é monitorada por um painel admin completo.

```
Colaborador faz pergunta no chat Bitrix24
         ↓
Sofia busca na base vetorial (pgvector)
         ↓
Monta resposta com OpenAI gpt-4o-mini
         ↓
Responde no Bitrix com fontes citadas
         ↓
Admin monitora via painel (kanban + dashboard)
```

---

## Quickstart

```bash
# 1. Clonar e instalar
git clone https://github.com/OsmarZM/Sofia-Assistente-Bitrix24.git
cd Sofia-Assistente-Bitrix24
pnpm install

# 2. Configurar ambiente
cp .env.example .env
# Edite .env e preencha: SUPABASE_SERVICE_ROLE_KEY, BITRIX_OUTGOING_TOKEN

# 3. Executar migrations (já aplicadas no Supabase cloud)
# Se precisar reaplicar: use o SQL Editor do Dashboard ou o MCP

# 4. Rodar em desenvolvimento
pnpm dev

# 5. Rodar em Docker (produção)
docker compose up -d
```

**Variáveis obrigatórias no `.env`**:

| Variável | Onde obter |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |
| `BITRIX_OUTGOING_TOKEN` | Bitrix24 → Aplicativos → Webhooks |
| `OPENAI_API_KEY` | platform.openai.com |
| `CREDENTIAL_ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

---

## Estrutura do Monorepo

```
sofia/
├── apps/
│   ├── api/          # API Fastify (webhooks Bitrix + rotas admin)
│   ├── worker/       # Workers BullMQ (ingestão, RAG, perfis, alertas)
│   └── admin/        # Painel admin Next.js 14
│
├── packages/
│   ├── db/           # Client Supabase + tipos gerados
│   ├── rag/          # Chunking, embeddings, retrieval, confidence
│   ├── ai-providers/ # Multi-provider IA (OpenAI, Azure, Anthropic…)
│   ├── bitrix/       # SDK Bitrix24 interno
│   ├── ingestion/    # Parsers PDF/DOCX/PPTX/URL/TXT
│   └── shared/       # Schemas Zod, utilitários, crypto, audit
│
├── supabase/
│   └── migrations/   # SQL versionado (0001..0004)
│
├── docs/             # Documentação completa → ver docs/README.md
├── scripts/          # regen-docs, check-drift
└── docker-compose.yml
```

---

## Documentação

| Seção | Link |
|---|---|
| Visão geral e objetivos | [docs/00-visao-geral/](docs/00-visao-geral/README.md) |
| Arquitetura e diagramas | [docs/01-arquitetura/](docs/01-arquitetura/overview.md) |
| Planejamento e roadmap | [docs/02-planejamento/](docs/02-planejamento/roadmap.md) |
| Backend (API + Worker) | [docs/03-backend/](docs/03-backend/estrutura-pastas.md) |
| Painel Admin | [docs/04-frontend-admin/](docs/04-frontend-admin/telas.md) |
| Integração Bitrix24 | [docs/05-bitrix24/](docs/05-bitrix24/integracao.md) |
| IA e RAG | [docs/06-ia-rag/](docs/06-ia-rag/embeddings.md) |
| Banco de dados | [docs/07-banco/](docs/07-banco/schema.md) |
| Deploy | [docs/08-deploy/](docs/08-deploy/docker.md) |
| Bugs e soluções | [docs/09-bugs-e-solucoes/](docs/09-bugs-e-solucoes/erros-conhecidos.md) |
| Referências | [docs/10-referencias/](docs/10-referencias/links.md) |

---

## Tech Stack

| Camada | Tecnologia |
|---|---|
| API | Node.js 20 + Fastify + TypeScript 5.5 (ESM) |
| Worker | BullMQ + Redis |
| Admin | Next.js 14 App Router + Tailwind + shadcn/ui |
| Banco | Supabase PostgreSQL + pgvector |
| IA Principal | OpenAI gpt-4o-mini + text-embedding-3-small |
| IA Fallback | Azure OpenAI → Anthropic → Grok → Gemini |
| Monorepo | pnpm workspaces |
| Deploy | Docker Compose → Portainer |

---

## Segurança

- **RLS habilitada** em todas as 24 tabelas (default-deny para anon)
- **service_role** exclusivo para API/Worker — nunca exposto ao frontend
- **AES-256-GCM** para credenciais de providers em `ai_providers.config`
- **timingSafeEqual** na validação do token Bitrix outbound
- **Audit log** em toda mutação administrativa

Veja [SECURITY.md](SECURITY.md) para política completa.

---

## Contribuindo

Leia [CONTRIBUTING.md](CONTRIBUTING.md) antes de abrir PRs.

---

## Licença

[MIT](LICENSE) — Fortatech Soluções Tecnológicas Ltda.
