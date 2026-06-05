# Deploy com Docker Compose

## Objetivo

Documentar como subir a stack Sofia com Docker Compose via Portainer.

## Onde fica

- `docker-compose.yml` — definição da stack
- `apps/api/Dockerfile` — imagem da API
- `apps/worker/Dockerfile` — imagem do Worker
- `apps/admin/Dockerfile` — imagem do Admin Next.js

---

## Arquitetura de containers

```mermaid
flowchart TD
    PORTAINER[Portainer] --> COMPOSE[(docker-compose.yml)]

    COMPOSE --> API[sofia-api\n:3001]
    COMPOSE --> WORKER[sofia-worker\n(sem porta exposta)]
    COMPOSE --> ADMIN[sofia-admin\n:3000]
    COMPOSE --> REDIS[redis:7-alpine\n:6379 interno]

    API --> REDIS
    WORKER --> REDIS
    API --> SUPABASE[(Supabase\nnuvem)]
    WORKER --> SUPABASE
    ADMIN --> API
```

---

## Serviços

| Serviço | Imagem | Porta | Healthcheck |
|---|---|---|---|
| `sofia-api` | `./apps/api` | `3001:3001` | `GET /health` |
| `sofia-worker` | `./apps/worker` | — | `pgrep node` |
| `sofia-admin` | `./apps/admin` | `3000:3000` | `GET /` |
| `redis` | `redis:7-alpine` | interno | `redis-cli ping` |

---

## Primeiro deploy (Portainer)

```bash
# 1. Transferir o projeto para o servidor
git clone https://github.com/fortatech/sofia-assistente.git
cd "sofia-assistente"

# 2. Configurar variáveis de ambiente
cp .env.example .env
nano .env  # preencher todos os valores obrigatórios

# 3. Build das imagens
docker compose build --no-cache

# 4. Subir a stack
docker compose up -d

# 5. Verificar
docker compose ps
docker compose logs -f sofia-api
```

---

## Via Portainer (interface web)

1. Portainer → Stacks → Add Stack → Upload
2. Selecionar `docker-compose.yml`
3. Em "Environment Variables", adicionar cada variável do `.env`
4. Deploy the Stack

---

## Atualizando a stack

```bash
# Pull do código novo
git pull origin main

# Rebuild da imagem alterada
docker compose build sofia-api

# Reiniciar só o serviço alterado (sem downtime dos outros)
docker compose up -d --no-deps sofia-api
```

---

## Rollback

```bash
# Ver histórico de imagens
docker images sofia-api

# Retaggear versão anterior
docker tag sofia-api:20260601 sofia-api:latest

# Reiniciar
docker compose up -d sofia-api
```

---

## Troubleshooting

Ver `docs/09-bugs-e-solucoes/troubleshooting-deploy.md` para erros comuns.

## Histórico de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-06-05 | Redis em container (não ElastiCache) | Single-tenant; custo e simplicidade |
| 2026-06-05 | Multi-stage Dockerfile (não npm ci em prod) | Imagem final ~150MB vs 800MB+ |
| 2026-06-05 | Worker sem porta exposta | Worker não recebe tráfego HTTP |
