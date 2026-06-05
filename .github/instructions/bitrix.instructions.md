---
applyTo: "packages/bitrix/**"
---

# Bitrix SDK — Instruções

## Propósito

`packages/bitrix` contém o SDK de comunicação com o Bitrix24: envio de mensagens e utilitários.

## Exports principais

```typescript
import { sendMessage, getUserInfo, isSofia } from '@sofia/bitrix'

// Enviar mensagem como Sofia
await sendMessage(dialogId, 'Texto da resposta')

// Verificar se o autor da mensagem é a própria Sofia (evitar loop)
if (isSofia(authorId)) return

// Buscar dados do usuário no Bitrix
const user = await getUserInfo(bitrixUserId)
```

## Regras obrigatórias

1. **`isSofia()`** deve ser sempre verificado antes de processar mensagem.
2. **Token do webhook outbound** (`BITRIX_INBOUND_WEBHOOK`) nunca exposto em logs.
3. **Erros de envio**: logar e não relançar para não travar o job — Sofia pode tentar novamente.
4. **Rate limit**: Bitrix limita a 2 req/s por usuário. Respeitar com delay se necessário.

## Variáveis de ambiente necessárias

```env
BITRIX_INBOUND_WEBHOOK=https://empresa.bitrix24.com.br/rest/{user_id}/{token}/
BITRIX_SOFIA_USER_ID=8243
BITRIX_DOMAIN=fortaeqt.bitrix24.com.br
```

## Referências

- Integração completa: `docs/05-bitrix24/integracao.md`
- Debug webhook: `docs/skills/debug-bitrix-webhook.SKILL.md`
