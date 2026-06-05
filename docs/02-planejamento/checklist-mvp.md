# Checklist MVP

## Fundação

- [x] Monorepo pnpm workspaces configurado
- [x] TypeScript 5.5 strict + ESM (NodeNext)
- [x] ESLint + Prettier + commitlint
- [x] Husky pre-commit (lint + regen-docs)
- [x] GitHub Actions CI (lint → typecheck → check-drift)
- [x] `.env.example` documentado

## Banco de Dados

- [x] Supabase projeto criado (`eeswigmlasmblrrvemzw`)
- [x] pgvector habilitado
- [x] 24 tabelas criadas (migration 0001)
- [x] Função `search_knowledge_chunks` (migration 0002)
- [x] RLS em todas as tabelas (migration 0003)
- [x] Funções hardened com search_path (migration 0004)
- [x] Seed: 5 fases kanban, 11 categorias, OpenAI provider, budgets

## RAG

- [x] `knowledge_documents` e `knowledge_chunks` criados
- [x] Chunker híbrido (semântico + sliding window)
- [x] Embeddings via text-embedding-3-small
- [x] Busca vetorial RPC (`search_knowledge_chunks`)
- [x] Confidence adaptativo (threshold + calibração)
- [x] Cache de respostas (TTL 1h)
- [x] Fallback multi-provider (OpenAI → Azure → Anthropic)

## Bitrix24

- [x] Webhook outbound configurado
- [x] Token validado (timingSafeEqual)
- [x] Evento `ONIMBOTMESSAGEADD` recebido e processado
- [x] Identificação da Sofia (ignora mensagem própria)
- [x] Resposta enviada via BITRIX_INBOUND_WEBHOOK
- [x] Histórico de sessão persistido
- [ ] Feedback 👍/👎 por reação testado em produção

## Ingestão

- [x] PDF (pdf-parse)
- [x] DOCX (mammoth com headings)
- [x] PPTX (por slide)
- [x] URL leve (cheerio + readability)
- [x] TXT/Markdown
- [x] Q&A Manual
- [x] Status tracking (uploaded → processing → processed/failed)
- [x] Propagação de effective_date/expires_at

## Painel Admin

- [x] Upload de documentos
- [x] Q&A Manual CRUD
- [x] Aprovação de sugestões
- [x] Kanban de conversas (dnd-kit)
- [x] Dashboard de métricas (recharts)
- [x] Live monitor (polling 5s)
- [x] Intervenção do admin (pausar Sofia + mensagem manual)
- [x] Configuração de providers de IA
- [x] Alertas automáticos (sino + badge)

## Segurança

- [x] RLS default-deny em todas as tabelas
- [x] AES-256-GCM em ai_providers.config
- [x] timingSafeEqual no webhook Bitrix
- [x] Audit log em mutações admin
- [x] search_path fixo em funções PostgreSQL

## Deploy

- [x] Dockerfile.api (multi-stage alpine)
- [x] Dockerfile.worker
- [x] Dockerfile.admin
- [x] docker-compose.yml
- [x] Healthchecks configurados

## Documentação

- [x] README.md com quickstart
- [x] SECURITY.md
- [x] CONTRIBUTING.md
- [x] docs/ estrutura completa
- [x] Skills Copilot (global + por módulo + sob demanda)

## Calibração (necessária antes de produção)

- [ ] Golden set criado (50-100 Q&A reais da Fortatech)
- [ ] `pnpm eval-rag` executado: precision ≥ 85%, recall ≥ 75%
- [ ] Threshold calibrado (`confidence_calibrated = true`)
- [ ] 10+ documentos com status `processed`

## Validação final

- [ ] `docker compose up` local: todos containers healthy
- [ ] Mensagem no Bitrix → resposta em < 5s
- [ ] Upload PDF → status `processed` em < 60s
- [ ] Admin: kanban move, intervenção, aprovar sugestão
- [ ] Dashboard: custos aparecendo após trocas
