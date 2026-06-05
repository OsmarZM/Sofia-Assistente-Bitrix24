# Escopo do MVP

## Incluído no MVP

### Canais
- ✅ Bitrix24 (chat individual e de grupo via webhook outbound)

### Ingestão de conhecimento
- ✅ PDF (via `pdf-parse`)
- ✅ DOCX (via `mammoth`, preserva headings para chunking semântico)
- ✅ PPTX (extrai por slide)
- ✅ URLs (leve: `cheerio` + `@mozilla/readability`; SPA com flag `requires_js`)
- ✅ TXT / Markdown
- ✅ Q&A Manual (pares pergunta/resposta via painel admin)

### IA
- ✅ OpenAI `gpt-4o-mini` (chat principal)
- ✅ OpenAI `text-embedding-3-small` (embeddings)
- ✅ Fallback: Azure OpenAI → Anthropic → Grok → Gemini (qualquer provider pode ser primário)
- ✅ Circuit breaker por provider
- ✅ Cache de respostas (TTL 1h)
- ✅ Threshold de confiança adaptativo (calibrado por feedback 👍/👎)

### Painel Admin
- ✅ Upload e gerenciamento de documentos
- ✅ Q&A Manual (CRUD)
- ✅ Aprovação de sugestões de conhecimento
- ✅ Kanban de conversas (Nova → Em andamento → Aguardando humano → Resolvida → Arquivada)
- ✅ Dashboard de métricas (custo, tokens, latência, confidence)
- ✅ Live monitor (polling 5s)
- ✅ Intervenção do admin (pausar Sofia, responder manualmente)
- ✅ Configuração de providers de IA
- ✅ Alertas automáticos (custo, circuit breaker, expiração)

### Segurança
- ✅ RLS em todas as 24 tabelas (default-deny)
- ✅ Credenciais de providers cifradas (AES-256-GCM)
- ✅ Token Bitrix validado com timing-safe equal
- ✅ Audit log em mutações admin

---

## Explicitamente fora do MVP

| Item | Versão prevista |
|---|---|
| WhatsApp, e-mail, outros canais | v1.1 |
| OCR de imagens | v1.1 |
| Transcrição de vídeos | v1.2 |
| Multi-empresa (multi-tenant) | v2.0 |
| RBAC granular (além de admin) | v1.1 |
| Fine-tuning de modelo | v2.0 |
| Webhook Bitrix para notificações (digest semanal) | v1.1 |
| WebSocket no live monitor | v1.1 |

---

## Critério de entrada em produção

Antes de ligar a Sofia para os colaboradores, é obrigatório:

1. **Fase de calibração**: criar golden set de 50–100 Q&A reais da Fortatech
2. **Avaliação**: precision ≥ 85% e recall ≥ 75% no golden set
3. **Base de conhecimento mínima**: pelo menos 10 documentos processados com status `processed`
4. **Smoke test completo** do deploy Docker
