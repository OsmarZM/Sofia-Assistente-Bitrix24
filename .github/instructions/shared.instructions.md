---
applyTo: "packages/shared/**"
---

# Shared Package — Instruções

## Propósito

`packages/shared` contém utilitários compartilhados entre API, Worker e outros pacotes.

## Exports

```typescript
import {
  encryptJSON,     // AES-256-GCM encrypt
  decryptJSON,     // AES-256-GCM decrypt
  safeEqual,       // timingSafeEqual para tokens
  generateEncryptionKey, // gera chave segura
  logAudit,        // audit_logs writer (async)
  logAuditBackground,    // audit_logs writer (fire-and-forget)
} from '@sofia/shared'
```

## Regras obrigatórias

1. **`encryptJSON`/`decryptJSON`**: SEMPRE para `ai_providers.config` — nunca plaintext.
2. **`safeEqual`**: SEMPRE para comparar tokens HTTP — nunca `===`.
3. **`logAudit`**: chamar após toda mutação em rotas admin.
4. **`logAuditBackground`**: usar em contextos onde não pode aguardar (webhooks, fire-and-forget).
5. **Variável de ambiente**: `CREDENTIAL_ENCRYPTION_KEY` deve ter 32 bytes base64.

## Exemplo completo

```typescript
import { encryptJSON, decryptJSON, safeEqual, logAudit } from '@sofia/shared'

// Salvar credencial cifrada
const encrypted = encryptJSON({ apiKey: 'sk-...' })
await supabase.from('ai_providers').insert({ name: 'openai', config: encrypted })

// Ler credencial decifrada
const { data } = await supabase.from('ai_providers').select('config').single()
const creds = decryptJSON<{ apiKey: string }>(data.config)

// Comparar token sem timing attack
if (!safeEqual(received, expected)) return reply.code(401).send()

// Audit log
await logAudit({ actor: userId, action: 'create', entity: 'ai_providers', entityId: id })
```

## Referências

- Segurança: `docs/01-arquitetura/seguranca.md`
- SECURITY.md: `SECURITY.md`
