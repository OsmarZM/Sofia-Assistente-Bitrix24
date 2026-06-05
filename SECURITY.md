# Política de Segurança — Sofia Assistente Virtual

## Versões suportadas

| Versão | Suportada |
|--------|-----------|
| main   | ✅ Sim     |

---

## Reportando vulnerabilidades

**Não abra GitHub Issues públicas para vulnerabilidades de segurança.**

Envie um e-mail para: **[seguranca@fortatech.com.br](mailto:seguranca@fortatech.com.br)**

Incluir no e-mail:
- Descrição detalhada da vulnerabilidade
- Passos para reproduzir
- Impacto potencial
- Versão/commit afetado

Respondemos em até **72 horas úteis**. Corrigimos e publicamos advisory em até 30 dias.

---

## Escopo de cobertura

### Em escopo

- Injeção SQL/NoSQL nas APIs Fastify
- Bypass de autenticação no painel admin
- Exposição de secrets (API keys, service_role key)
- Vulnerabilidades nas rotas de webhook Bitrix
- RLS bypass no Supabase
- Decifra não autorizada de `ai_providers.config`

### Fora de escopo

- Ataques que requerem acesso físico à máquina
- Ataques de força bruta contra contas de terceiros (Bitrix24, OpenAI)
- Vulnerabilidades em dependências de terceiros sem prova de exploração no projeto

---

## Arquitetura de segurança

### Row Level Security (RLS)

Todas as 24 tabelas do schema `public` têm RLS habilitada:

```
Default-deny: nenhuma linha acessível via anon/authenticated
service_role: bypassa RLS nativamente (somente API + Worker)
Admin Next.js: consome a API Fastify (nunca Supabase direto)
```

Migrations relevantes:
- `supabase/migrations/0003_security_rls.sql` — `ENABLE ROW LEVEL SECURITY` em todas as tabelas
- `supabase/migrations/0004_function_hardening.sql` — `search_path` fixo em funções

### Credenciais de providers de IA

As credenciais em `ai_providers.config` são cifradas com **AES-256-GCM** antes de serem gravadas no banco.

- Chave: `CREDENTIAL_ENCRYPTION_KEY` (32 bytes base64, exclusiva por deploy)
- IV: 12 bytes aleatórios por operação de cifra
- Auth tag: 16 bytes (garante integridade)
- Implementação: `packages/shared/src/crypto.ts`

**A coluna `config` é sempre removida das respostas da API** — nunca exposta ao frontend.

### Webhook Bitrix24

O token de autenticação do webhook outbound é validado com `crypto.timingSafeEqual` para evitar timing attacks:

```typescript
// apps/api/src/routes/webhooks/bitrix.ts
if (OUTGOING_TOKEN && !safeEqual(receivedToken, OUTGOING_TOKEN)) {
  // Reject 401 + audit log
}
```

### Audit Log

Toda mutação administrativa grava em `audit_logs`:

| Ação | Entidade | Campos gravados |
|---|---|---|
| Criar documento | knowledge_documents | before=null, after=snapshot |
| Aprovar sugestão | knowledge_suggestions | before=pending, after=approved |
| Intervenção em sessão | chat_sessions | action, admin_id |
| Alterar provider | ai_providers | before/after sem credenciais |
| Toggle provider | ai_providers | enabled |

### Funções PostgreSQL

- `search_knowledge_chunks` — `SECURITY DEFINER` (necessário para RLS bypass em RAG) + `search_path = public, pg_catalog`
- `advance_session_phase` — `SECURITY INVOKER` + `search_path = public, pg_catalog`

---

## Rotação de secrets

Ao suspeitar de comprometimento de qualquer secret:

1. **`OPENAI_API_KEY`** — revogar em platform.openai.com → gerar nova → atualizar `.env` → reiniciar containers
2. **`SUPABASE_SERVICE_ROLE_KEY`** — revogar no Dashboard (Settings → API → Regenerate) → atualizar `.env` → reiniciar
3. **`CREDENTIAL_ENCRYPTION_KEY`** — gerar nova chave → re-cifrar todos os registros de `ai_providers` com a nova chave → atualizar `.env` → reiniciar
4. **`JWT_SECRET`** — gerar novo → atualizar `.env` → reiniciar (invalida sessões ativas do admin)
5. **`BITRIX_OUTGOING_TOKEN`** — revogar no Bitrix24 → gerar novo webhook → atualizar `.env` → reiniciar

---

## Ameaças conhecidas e mitigações

| Ameaça | Mitigação |
|---|---|
| Acesso direto ao Supabase via anon key | RLS default-deny em todas as tabelas |
| Exfiltração de API keys de providers | AES-256-GCM em `ai_providers.config` |
| Falsificação de requisições do Bitrix | timingSafeEqual no application_token |
| SQL injection via pgvector search | Uso de RPC parametrizado (`search_knowledge_chunks`) |
| Prompt injection via conteúdo ingerido | Sanitização no chunker; resposta Sofia não executa código |
| Credenciais em logs | pino configurado para redact `['*.key', '*.secret', '*.token', '*.password']` |

---

## Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase RLS Guide](https://supabase.com/docs/guides/database/row-level-security)
- [PostgreSQL search_path Security](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- [Node.js crypto.timingSafeEqual](https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b)
