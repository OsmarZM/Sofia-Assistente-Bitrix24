# Fluxo Bitrix24

## Objetivo

Descrever o ciclo completo de vida de uma mensagem: do colaborador digitando no Bitrix24 até a Sofia responder.

## Onde fica

- `apps/api/src/routes/webhooks/bitrix.ts` — recebe o evento
- `apps/worker/src/jobs/bitrix-message.ts` — processa o evento (18 passos)
- `packages/bitrix/src/sdk.ts` — envia resposta

## Como funciona

O Bitrix24 dispara um webhook POST para a API ao receber uma mensagem. A API valida o token, persiste o evento e enfileira um job no Redis. O Worker pega o job, executa o pipeline completo e chama a API do Bitrix para enviar a resposta.

## Diagrama

```mermaid
sequenceDiagram
    participant U as Colaborador (Bitrix24)
    participant B24 as Bitrix24 Server
    participant API as API Fastify
    participant Q as Redis/BullMQ
    participant W as Worker
    participant DB as Supabase
    participant RAG as RAG Engine
    participant AI as OpenAI

    U->>B24: Digita mensagem no chat
    B24->>API: POST /webhooks/bitrix (application_token)
    API->>API: Valida token (timingSafeEqual)
    API->>DB: INSERT bitrix_events
    API->>Q: Enfileira job bitrix-message
    API-->>B24: 200 OK (< 1s)

    Q->>W: Job disponível
    W->>DB: Upsert users (dados do Bitrix)
    W->>DB: Upsert chat_sessions
    W->>DB: INSERT chat_messages (role=user)
    W->>DB: SELECT últimas 20 mensagens
    W->>DB: SELECT user_profiles.summary_text

    W->>RAG: pergunta + contexto histórico
    RAG->>AI: text-embedding-3-small (query embedding)
    AI-->>RAG: vetor float[1536]
    RAG->>DB: search_knowledge_chunks(embedding, threshold)
    DB-->>RAG: chunks mais similares + similarity score

    RAG->>RAG: Calcula confidence (top score + cobertura)
    alt confidence >= threshold
        RAG->>AI: gpt-4o-mini (prompt + contexto + chunks)
        AI-->>RAG: resposta gerada
        RAG-->>W: resposta + fontes + confidence + custo
    else confidence < threshold
        RAG-->>W: "não encontrei" + cria knowledge_suggestion
    end

    W->>DB: INSERT chat_messages (role=sofia)
    W->>DB: UPDATE confidence_calibration (se feedback)
    W->>B24: sendMessage (via BITRIX_INBOUND_WEBHOOK)
    B24-->>U: Resposta aparece no chat
```

## Arquivos relacionados

- `apps/api/src/routes/webhooks/bitrix.ts`
- `apps/worker/src/jobs/bitrix-message.ts`
- `packages/bitrix/src/sdk.ts`
- `packages/rag/src/retriever.ts`
- `packages/rag/src/confidence.ts`

## Regras importantes

- A API deve responder em **< 3 segundos** para o Bitrix24 não retentar
- O Worker processa de forma assíncrona (pode demorar até 30s)
- Mensagens da própria Sofia (`FROM_USER_ID === BITRIX_SOFIA_USER_ID`) são **ignoradas** para evitar loops
- Se `chat_sessions.sofia_paused = true`, o Worker ignora a mensagem
- Cache de resposta: se mesma pergunta + mesmos chunks já foram respondidos (TTL 1h), usa cache e grava `cache_hit=true`

## Problemas conhecidos

| Erro | Causa | Solução |
|---|---|---|
| Loop de mensagens | Sofia respondeu sua própria mensagem | Verificar `BITRIX_SOFIA_USER_ID` no `.env` |
| 401 no webhook | Token outgoing incorreto ou expirado | Atualizar `BITRIX_OUTGOING_TOKEN` e reiniciar API |
| Timeout na resposta | RAG + LLM demorando > 3s | API já retorna 200 imediatamente; Worker processa async |

## Histórico de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-06-05 | Processamento assíncrono via BullMQ | API deve responder < 3s ao Bitrix; RAG pode demorar mais |
| 2026-06-05 | Ignorar próprias mensagens pelo user_id | Evitar loop; mais seguro que verificar author name |
