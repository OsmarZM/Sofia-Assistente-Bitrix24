---
description: "Guia passo a passo para fazer deploy da stack Sofia no Portainer. Use ao subir pela primeira vez ou ao atualizar em produção."
---

# Skill: Deploy no Portainer

## Quando usar

- Primeiro deploy em produção
- Atualizar imagens após mudanças de código
- Rollback para versão anterior

---

## Pré-requisitos

- [ ] Portainer instalado e acessível
- [ ] Docker Engine no servidor
- [ ] Repositório clonado no servidor ou imagens em registry
- [ ] `.env` configurado com todos os valores (não apenas `.env.example`)

---

## Primeiro deploy

### Opção A: Upload via interface Portainer

1. Portainer → **Stacks** → **Add Stack**
2. Nome: `sofia-assistente`
3. Build method: **Upload** → selecionar `docker-compose.yml`
4. Em **Environment Variables**, adicionar cada linha do `.env`:
   - Clicar em "Add an environment variable"
   - Repetir para todas as variáveis obrigatórias
5. **Deploy the Stack**

### Opção B: CLI no servidor

```bash
# No servidor
cd /opt/sofia-assistente

# Clonar repositório
git clone https://github.com/fortatech/sofia-assistente.git .

# Configurar .env
cp .env.example .env
nano .env  # preencher todos os valores

# Build
docker compose build --no-cache

# Deploy
docker compose up -d

# Verificar
docker compose ps
docker compose logs -f sofia-api
```

---

## Verificação pós-deploy

```bash
# 1. Todos os containers running
docker compose ps
# Esperado: sofia-api, sofia-worker, sofia-admin, redis = Up (healthy)

# 2. API respondendo
curl http://localhost:3001/health
# Esperado: { "status": "ok", "uptime": N }

# 3. Admin acessível
curl http://localhost:3000
# Esperado: 200 com HTML

# 4. Worker processando
docker compose logs sofia-worker | tail -20
# Esperado: "Worker started, waiting for jobs..."
```

---

## Atualizar stack (deploy de nova versão)

```bash
# No servidor
cd /opt/sofia-assistente
git pull origin main

# Rebuild somente o serviço alterado
docker compose build sofia-api

# Restart sem downtime dos outros serviços
docker compose up -d --no-deps sofia-api

# Se mudou worker também:
docker compose build sofia-worker
docker compose up -d --no-deps sofia-worker
```

---

## Rollback

```bash
# Ver imagens disponíveis com tags de data
docker images | grep sofia

# Retaggear imagem anterior
docker tag sofia-assistente-sofia-api:20260601 sofia-assistente-sofia-api:latest

# Reiniciar com imagem antiga
docker compose up -d --no-deps sofia-api
```

---

## Troubleshooting

| Sintoma | Verificação |
|---|---|
| Container restart loop | `docker compose logs sofia-api --tail=50` |
| API 502 Bad Gateway | Container API subiu? `docker compose ps` |
| Jobs travados no BullMQ | `docker compose logs sofia-worker` |
| Banco inacessível | Verificar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no `.env` |
| Redis connection refused | `docker compose ps redis` — está healthy? |

## Referências

- Docker: `docs/08-deploy/docker.md`
- Erros conhecidos: `docs/09-bugs-e-solucoes/erros-conhecidos.md`
- Variáveis de ambiente: `docs/03-backend/env.md`
