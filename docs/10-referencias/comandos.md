# Comandos Úteis

## Objetivo

Referência rápida de comandos para o dia a dia do desenvolvimento.

---

## Setup

```bash
# Instalar dependências
pnpm install

# Gerar tipos do banco (após alterar schema)
pnpm --filter @sofia/db generate:types

# Verificar tudo (lint + typecheck + check-drift)
pnpm run ci
```

---

## Desenvolvimento

```bash
# Subir tudo em modo dev
pnpm dev

# Só a API
pnpm --filter @sofia/api dev

# Só o Worker
pnpm --filter @sofia/worker dev

# Só o Admin
pnpm --filter @sofia/admin dev
```

---

## Build e Docker

```bash
# Build de todos os pacotes
pnpm build

# Build da imagem Docker da API
docker compose build sofia-api

# Subir stack completa
docker compose up -d

# Ver logs em tempo real
docker compose logs -f sofia-api sofia-worker

# Status dos containers
docker compose ps

# Reiniciar um serviço
docker compose restart sofia-api
```

---

## Banco de dados

```bash
# Aplicar migration via MCP (VS Code)
# Use a tool mcp_supabase_apply_migration no Copilot

# Listar migrations aplicadas
# Use mcp_supabase_list_migrations no Copilot

# Conectar ao banco (se DNS funcionar)
psql "postgresql://postgres:<SENHA>@db.eeswigmlasmblrrvemzw.supabase.co:5432/postgres"
```

---

## Git

```bash
# Commit com Conventional Commits
git add .
git commit -m "feat(rag): adiciona reranking por BM25"
git commit -m "fix(bitrix): corrige handling de reações"
git commit -m "docs: atualiza rotas-api.md"

# Push
git push origin main

# Ver log resumido
git log --oneline -20
```

---

## Geração de chaves

```bash
# JWT_SECRET (64 chars hex)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# CREDENTIAL_ENCRYPTION_KEY (32 bytes base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Redis (BullMQ)

```bash
# Via docker compose
docker compose exec redis redis-cli

# Listar filas
redis-cli KEYS "bull:*:waiting"

# Contar jobs pendentes na fila bitrix-message
redis-cli LLEN bull:bitrix-message:waiting

# Limpar fila (USE COM CUIDADO)
redis-cli DEL bull:bitrix-message:waiting
```

---

## Links úteis

| Recurso | URL |
|---|---|
| Supabase Dashboard | https://app.supabase.io/project/eeswigmlasmblrrvemzw |
| Supabase SQL Editor | https://app.supabase.io/project/eeswigmlasmblrrvemzw/editor |
| OpenAI API | https://platform.openai.com/api-keys |
| Bitrix24 Webhooks | https://fortaeqt.bitrix24.com.br/devops/edit-rest-application/ |
