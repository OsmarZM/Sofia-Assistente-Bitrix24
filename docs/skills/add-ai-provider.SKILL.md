---
description: "Guia passo a passo para adicionar um novo provider de IA (ex: Mistral, Cohere) ao ProviderRouter da Sofia. Use quando precisar integrar um novo LLM."
---

# Skill: Adicionar Novo Provider de IA

## Quando usar

Quando precisar integrar um novo LLM provider (ex: Mistral, Cohere, Bedrock) ao sistema de fallback.

## Passo a passo

### 1. Criar o arquivo do provider

```bash
packages/ai-providers/src/providers/mistral.ts
```

```typescript
import type { ProviderResponse, ChatMessage } from '../types.js'

export async function callMistral(
  config: { apiKey: string; model?: string },
  messages: ChatMessage[],
  systemPrompt: string
): Promise<ProviderResponse> {
  const model = config.model ?? 'mistral-large-latest'

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Mistral error: ${response.status} ${await response.text()}`)
  }

  const data = await response.json()
  const choice = data.choices[0]

  return {
    text: choice.message.content,
    inputTokens: data.usage.prompt_tokens,
    outputTokens: data.usage.completion_tokens,
  }
}
```

### 2. Registrar no ProviderRouter

Em `packages/ai-providers/src/router.ts`, adicionar case para `provider.type === 'mistral'`:

```typescript
import { callMistral } from './providers/mistral.js'

// Dentro do switch/if de tipos:
case 'mistral':
  return callMistral(decryptJSON(provider.config), messages, systemPrompt)
```

### 3. Adicionar pricing no banco

```sql
INSERT INTO ai_pricing (provider_id, model, input_price_per_1k, output_price_per_1k)
VALUES ('<ID_DO_PROVIDER>', 'mistral-large-latest', 0.003, 0.009);
```

### 4. Criar registro no painel admin

Via painel: **Settings → Providers → Adicionar Provider**

- Nome: `Mistral`
- Tipo: `mistral`
- Modelo: `mistral-large-latest`
- Prioridade: posição desejada no fallback
- Config (JSON): `{ "apiKey": "sk-..." }` — será cifrado com AES-256-GCM

### 5. Testar

```typescript
// apps/api ou worker — teste isolado
import { createProviderRouter } from '@sofia/ai-providers'
const router = await createProviderRouter()
const result = await router.chat({
  messages: [{ role: 'user', content: 'Olá, quem é você?' }],
  systemPrompt: 'Você é um assistente.',
})
console.log(result.text, result.costUsd)
```

### 6. Checklist

- [ ] `packages/ai-providers/src/providers/mistral.ts` criado
- [ ] Registrado no `router.ts`
- [ ] Pricing inserido em `ai_pricing`
- [ ] Registro criado no painel admin (config cifrada)
- [ ] Testar chamada direta
- [ ] Testar failover (desabilitar OpenAI e verificar que Mistral é usado)
- [ ] Adicionar variáveis ao `.env.example` se necessário

## Referências

- Router: `packages/ai-providers/src/router.ts`
- Providers existentes: `packages/ai-providers/src/providers/`
- Circuit breaker: `packages/ai-providers/src/circuit-breaker.ts`
