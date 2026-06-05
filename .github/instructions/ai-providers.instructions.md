---
applyTo: "packages/ai-providers/**"
---

# AI Providers — Instruções

## Propósito

`packages/ai-providers` implementa o roteador de providers de IA com fallback automático e circuit breaker.

## Cadeia de fallback

```
OpenAI → Azure OpenAI → Anthropic → Grok → Gemini
```

Configurável em runtime via tabela `ai_providers` no banco.

## Módulos

| Arquivo | Responsabilidade |
|---|---|
| `router.ts` | ProviderRouter: tenta providers em ordem de prioridade |
| `circuit-breaker.ts` | Abre circuit após N falhas; tenta novamente após cooldown |
| `cost-meter.ts` | Calcula custo via `ai_pricing` |
| `registry.ts` | Lê `ai_providers`, decifra config com `decryptJSON` |
| `providers/*.ts` | Implementações por provider |

## Regras obrigatórias

1. **Credenciais**: sempre decifrar com `decryptJSON` de `@sofia/shared` antes de usar.
2. **Circuit breaker**: respeitar `circuit_open_until` de `ai_provider_health`.
3. **Custo**: sempre registrar em `chat_messages.total_cost_usd` após resposta.
4. **Erro de todos providers**: lançar `Error('all_providers_failed')` — nunca retornar undefined.

## Uso

```typescript
import { createProviderRouter } from '@sofia/ai-providers'

const router = await createProviderRouter()
const { text, inputTokens, outputTokens, costUsd, providerId } = await router.chat({
  messages: [...],
  systemPrompt: '...',
})
```

## Referências

- Skill novo provider: `docs/skills/add-ai-provider.SKILL.md`
