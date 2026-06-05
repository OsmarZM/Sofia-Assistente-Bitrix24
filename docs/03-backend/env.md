# Variáveis de Ambiente

## Objetivo

Documentar cada variável de ambiente: o que faz, de onde obter e se é obrigatória.

## Onde fica

- `.env` — valores reais (nunca commitado)
- `.env.example` — template com placeholders
- `CONTRIBUTING.md` — instruções de setup

---

## Variáveis obrigatórias

| Variável | Exemplo | De onde obter |
|---|---|---|
| `OPENAI_API_KEY` | `sk-proj-...` | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| `SUPABASE_URL` | `https://xyz.supabase.co` | Supabase Dashboard → Settings → API |
| `SUPABASE_ANON_KEY` | `eyJ...` | Supabase Dashboard → Settings → API → anon/public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase Dashboard → Settings → API → service_role |
| `BITRIX_INBOUND_WEBHOOK` | `https://empresa.bitrix24.com.br/rest/.../` | Bitrix24 → Aplicativos → Webhooks Inbound |
| `BITRIX_SOFIA_USER_ID` | `8243` | ID do usuário Sofia no Bitrix (URL do perfil) |
| `JWT_SECRET` | 32+ chars aleatórios | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `CREDENTIAL_ENCRYPTION_KEY` | base64 32 bytes | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |

---

## Variáveis opcionais

| Variável | Padrão | Descrição |
|---|---|---|
| `OPENAI_MODEL_CHAT` | `gpt-4o-mini` | Modelo de chat OpenAI |
| `OPENAI_MODEL_EMBED` | `text-embedding-3-small` | Modelo de embedding |
| `SUPABASE_DB_PASSWORD` | — | Senha DB (para psql direto) |
| `BITRIX_OUTGOING_TOKEN` | — | Token do webhook outbound (recomendado) |
| `BITRIX_DOMAIN` | — | Domínio do portal Bitrix |
| `REDIS_HOST` | `localhost` | Host do Redis |
| `REDIS_PORT` | `6379` | Porta do Redis |
| `REDIS_PASSWORD` | — | Senha do Redis |
| `API_PORT` | `3001` | Porta da API Fastify |
| `API_HOST` | `0.0.0.0` | Host da API |
| `NODE_ENV` | `development` | `development` ou `production` |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | URL da API para o Next.js |
| `ADMIN_PORT` | `3000` | Porta do admin |
| `AZURE_OPENAI_API_KEY` | — | Provider secundário Azure |
| `AZURE_OPENAI_ENDPOINT` | — | Endpoint Azure OpenAI |
| `AZURE_OPENAI_DEPLOYMENT` | — | Nome do deployment Azure |
| `ANTHROPIC_API_KEY` | — | Provider terciário Anthropic |
| `GROK_API_KEY` | — | Provider quaternário Grok/xAI |
| `GEMINI_API_KEY` | — | Provider quinário Gemini |
| `DAILY_COST_LIMIT_USD` | `10.00` | Budget diário |
| `MONTHLY_COST_LIMIT_USD` | `200.00` | Budget mensal |
| `COST_ALERT_THRESHOLD_PCT` | `80` | % do budget para disparar alerta |

---

## ⚠️ Nunca faça isso

```bash
# ❌ Commitar .env
git add .env

# ❌ Imprimir variáveis sensíveis em logs
console.log(process.env.OPENAI_API_KEY)

# ❌ Expor SUPABASE_SERVICE_ROLE_KEY no frontend
```

## Verificando o .env

```bash
# Verifica se todas as variáveis obrigatórias estão presentes
node -e "
const required = [
  'OPENAI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
  'BITRIX_INBOUND_WEBHOOK', 'BITRIX_SOFIA_USER_ID',
  'JWT_SECRET', 'CREDENTIAL_ENCRYPTION_KEY'
]
const missing = required.filter(k => !process.env[k])
if (missing.length) { console.error('Faltando:', missing); process.exit(1) }
console.log('✅ Todas as variáveis obrigatórias presentes')
"
```
