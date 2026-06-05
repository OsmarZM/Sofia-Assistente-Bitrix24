# Roadmap

## Status atual (2026-06-05)

| Fase | Status | Descrição |
|---|---|---|
| Fase 0 — Bootstrap | ✅ Concluída | Monorepo pnpm, configs, CI |
| Fase 1 — Schema | ✅ Concluída | 24 tabelas, pgvector, migrations 0001-0004 |
| Fase 2 — RAG | ✅ Concluída | chunker, retriever, confidence, cache |
| Fase 3 — API | ✅ Concluída | Fastify, todas as rotas, Zod |
| Fase 4 — Bitrix | ✅ Concluída | SDK, webhook, worker pipeline 18 passos |
| Fase 5 — Ingestão | ✅ Concluída | PDF/DOCX/PPTX/URL/TXT parsers |
| Fase 6 — Perfis | ✅ Concluída | Decay exponencial, digest semanal |
| Fase 7 — Admin base | ✅ Concluída | Todas as telas do painel |
| Fase 8 — Deploy | ✅ Concluída | Dockerfiles, docker-compose |
| Fase 9 — Observabilidade | ✅ Concluída | Kanban, dashboard, live monitor, alertas |
| Segurança hardening | ✅ Concluída | RLS, cifra AES-256-GCM, audit log |
| Documentação | ✅ Concluída | Esta estrutura docs/ + skills Copilot |
| **Calibração** | 🔄 **Próximo** | Golden set 50-100 Q&A + avaliação RAG |
| **Deploy Portainer** | 🔄 **Próximo** | Subir stack em produção |

---

## v1.1 (pós-MVP)

- [ ] Rotação automática de `CREDENTIAL_ENCRYPTION_KEY`
- [ ] Notificação semanal de digest no Bitrix24 (não apenas card no painel)
- [ ] OCR de imagens em documentos PDF
- [ ] WhatsApp como canal alternativo
- [ ] RBAC granular (Revisor separado de Admin)
- [ ] WebSocket no live monitor (substituir polling 5s)
- [ ] Rate limiting por usuário Bitrix

## v2.0

- [ ] Multi-tenant (múltiplas empresas)
- [ ] Fine-tuning de modelo com conversas reais
- [ ] Transcrição de vídeos (Whisper)
- [ ] Integração com Google Drive / SharePoint para ingestão automática
