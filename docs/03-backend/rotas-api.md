# Rotas da API

## Objetivo

Listar todos os endpoints da API Fastify com método, path, autenticação e payload.

## Base URL

```
http://localhost:3001    (desenvolvimento)
http://api:3001          (docker-compose interno)
```

---

## Webhook Bitrix24

| Método | Path | Auth | Descrição |
|---|---|---|---|
| `POST` | `/webhooks/bitrix` | application_token | Recebe eventos do Bitrix24 |

**Body** (application/json ou form-urlencoded):
```json
{
  "event": "ONIMBOTMESSAGEADD",
  "auth": { "application_token": "..." },
  "data": {
    "PARAMS": {
      "FROM_USER_ID": "123",
      "DIALOG_ID": "chat456",
      "MESSAGE": "Qual é a política de férias?"
    }
  }
}
```

---

## Admin — Documentos

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/admin/documents` | Lista documentos (filtros: status, category_id) |
| `POST` | `/admin/documents` | Cria documento + enfileira ingestão |
| `GET` | `/admin/documents/:id` | Detalhe de um documento |
| `PATCH` | `/admin/documents/:id` | Atualiza metadados |
| `DELETE` | `/admin/documents/:id` | Arquiva documento |
| `POST` | `/admin/documents/:id/reprocess` | Re-ingere documento |

---

## Admin — Q&A Manual

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/admin/manual-qa` | Lista Q&A manuais |
| `POST` | `/admin/manual-qa` | Cria par pergunta/resposta |
| `PATCH` | `/admin/manual-qa/:id` | Atualiza par |
| `DELETE` | `/admin/manual-qa/:id` | Arquiva par |

---

## Admin — Sugestões

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/admin/suggestions` | Lista sugestões (filtro: status=pending) |
| `POST` | `/admin/suggestions/:id/approve` | Aprova e cria Q&A manual |
| `POST` | `/admin/suggestions/:id/reject` | Rejeita |

---

## Admin — Providers IA

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/admin/providers` | Lista providers com estado circuit breaker |
| `POST` | `/admin/providers` | Cria provider (config cifrada) |
| `PATCH` | `/admin/providers/:id` | Atualiza provider |
| `POST` | `/admin/providers/:id/toggle` | Ativa/desativa |

---

## Admin — Conversas e Kanban

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/admin/sessions` | Lista sessões por fase |
| `GET` | `/admin/sessions/:id/messages` | Mensagens de uma sessão |
| `POST` | `/admin/sessions/:id/phase` | Move sessão de fase |
| `POST` | `/admin/sessions/:id/pause` | Pausa Sofia nesta sessão |
| `POST` | `/admin/sessions/:id/resume` | Retoma Sofia |
| `POST` | `/admin/sessions/:id/message` | Admin envia mensagem como Sofia |
| `GET` | `/admin/live` | Sessões ativas (delta últimos N segundos) |

---

## Admin — Dashboard

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/admin/dashboard/metrics` | Cards: perguntas, custo, cache hit rate |
| `GET` | `/admin/dashboard/costs` | Série temporal de custo por dia |
| `GET` | `/admin/dashboard/latency` | p50/p95/p99 por provider |
| `GET` | `/admin/dashboard/confidence` | Histograma de confidence |
| `GET` | `/admin/dashboard/top-users` | Top 10 usuários |
| `GET` | `/admin/alerts` | Alertas não reconhecidos |
| `POST` | `/admin/alerts/:id/ack` | Reconhece alerta |

---

## Admin — Usuários e Perfis

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/admin/users` | Lista usuários com último acesso |
| `GET` | `/admin/users/:id/profile` | Perfil analítico do usuário |

---

## Healthcheck

| Método | Path | Descrição |
|---|---|---|
| `GET` | `/health` | Retorna `{ status: 'ok', uptime: N }` |
