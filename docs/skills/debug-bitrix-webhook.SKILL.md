---
description: "Diagnóstico passo a passo de problemas no webhook Bitrix24 da Sofia. Use quando mensagens não chegam, Sofia não responde, ou há erros 401/500 no webhook."
---

# Skill: Debug do Webhook Bitrix24

## Quando usar

- Sofia não responde no Bitrix24
- Erros 401 ou 500 no log da API
- Mensagens chegam mas sem resposta
- Loop de mensagens (Sofia respondendo a si mesma)

---

## Diagnóstico rápido

### 1. Verificar logs da API

```bash
docker compose logs --tail=50 sofia-api | grep -i "bitrix\|webhook\|401\|500"
```

### 2. Testar se a API está recebendo

```bash
# Simular evento Bitrix
curl -X POST http://localhost:3001/webhooks/bitrix \
  -H "Content-Type: application/json" \
  -d '{
    "event": "ONIMBOTMESSAGEADD",
    "auth": { "application_token": "SEU_TOKEN_AQUI" },
    "data": {
      "PARAMS": {
        "FROM_USER_ID": "999",
        "DIALOG_ID": "chat_test",
        "MESSAGE": "teste"
      }
    }
  }'
# Esperado: 200 OK com { queued: true }
```

---

## Erros comuns e soluções

### Erro: `401 Unauthorized`

**Causa**: `BITRIX_OUTGOING_TOKEN` não está configurado ou está errado.

**Solução**:
1. Bitrix24 → Aplicativos → Webhooks → Editar webhook inbound
2. Copiar `application_token` gerado
3. Atualizar `BITRIX_OUTGOING_TOKEN` no `.env`
4. Reiniciar API: `docker compose restart sofia-api`

**Verificação**: O token gerado pelo Bitrix é o que vai no campo `auth.application_token` de cada request.

---

### Erro: Sofia responde a si mesma (loop)

**Causa**: `BITRIX_SOFIA_USER_ID` está errado ou vazio.

**Solução**:
1. Verificar URL do perfil da Sofia no Bitrix: `https://empresa.bitrix24.com.br/company/personal/user/NUMERO/`
2. O número na URL é o `user_id`
3. Atualizar `BITRIX_SOFIA_USER_ID` no `.env`

---

### Erro: Mensagens chegam mas sem resposta (job travado)

**Verificação**:
```bash
# Ver jobs com erro no BullMQ
docker compose exec redis redis-cli ZRANGE bull:bitrix-message:failed 0 -1

# Ver logs do worker
docker compose logs --tail=50 sofia-worker
```

**Causa comum**: `OPENAI_API_KEY` inválida ou `SUPABASE_SERVICE_ROLE_KEY` vencida.

---

### Erro: Timeout no Bitrix (> 3s sem resposta)

**Causa**: Webhook demora mais de 3s para responder.

**Solução**: A API deve retornar 200 IMEDIATAMENTE após enfileirar o job, antes de processar o RAG. Verificar se o job está sendo enfileirado antes do await do pipeline.

**Padrão correto**:
```typescript
// ✅ Enfileira e retorna imediatamente
await bitrixMessageQueue.add('process', { eventId: event.id })
return reply.code(200).send({ queued: true })

// ❌ Errado — aguarda o pipeline antes de responder
await processBitrixMessage(event)
return reply.code(200).send({ done: true })
```

---

### Erro: Webhook não configurado no Bitrix

**Passos para configurar**:
1. Bitrix24 → Aplicativos → Webhooks de entrada → Criar
2. Preencher URL: `https://SUA_API/webhooks/bitrix`
3. Marcar evento: `ONIMBOTMESSAGEADD`
4. Salvar e copiar `application_token`

---

## Verificação end-to-end

1. [ ] API online: `curl http://localhost:3001/health`
2. [ ] Webhook configurado no Bitrix com URL correta
3. [ ] `BITRIX_OUTGOING_TOKEN` = `application_token` do Bitrix
4. [ ] `BITRIX_SOFIA_USER_ID` = ID numérico do usuário Sofia
5. [ ] `BITRIX_INBOUND_WEBHOOK` = URL do webhook outbound gerado para Sofia
6. [ ] Worker online: `docker compose ps sofia-worker`
7. [ ] Redis online: `docker compose ps redis`

## Referências

- Integração: `docs/05-bitrix24/integracao.md`
- Erros conhecidos: `docs/09-bugs-e-solucoes/erros-conhecidos.md`
- Webhook code: `apps/api/src/routes/webhooks/bitrix.ts`
