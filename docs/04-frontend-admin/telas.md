# Telas do Painel Admin

## Objetivo

Documentar cada tela do painel admin Next.js 14.

## Onde fica

`apps/admin/src/app/` — estrutura App Router do Next.js 14

---

## Fluxo de navegação

```mermaid
flowchart TD
    LOGIN[Login\n/auth/login] --> DASH[Dashboard\n/dashboard]
    DASH --> KANBAN[Kanban de Conversas\n/conversations]
    DASH --> DOCS[Documentos\n/knowledge/documents]
    DASH --> QA[Q&A Manual\n/knowledge/qa]
    DASH --> SUGG[Sugestões\n/knowledge/suggestions]
    DASH --> USERS[Usuários\n/users]
    DASH --> PROVIDERS[Providers IA\n/settings/providers]
    DASH --> SETTINGS[Configurações\n/settings]
    KANBAN --> DRAWER[Drawer de Conversa\n(componente lateral)]
```

---

## Telas em detalhe

### Dashboard (`/dashboard`)

Cards superiores:
- Perguntas hoje / custo hoje (USD) / custo no mês
- Taxa "não sei" / cache hit rate / % budget consumido

Gráficos:
- Tokens in/out por dia (stacked, por provider)
- Custo por dia (com linha de budget)
- Latência p50/p95/p99
- Histograma de confidence (com linha do threshold)
- Top 10 usuários / top categorias

---

### Kanban de Conversas (`/conversations`)

Colunas (fases configuráveis):

```
Nova → Em andamento → Aguardando humano → Resolvida → Arquivada
```

Cards mostram:
- Nome + foto do usuário (Bitrix)
- Última mensagem (truncada)
- Tempo desde última atividade
- Badge de confidence média
- Custo e tokens da sessão
- Ícone de sentimento
- Contagem de mensagens

**Drag-and-drop** entre colunas (dnd-kit) → grava em `conversation_phase_transitions`

Click no card → **Drawer lateral** com:
- Histórico completo da conversa
- Botão "Pausar Sofia"
- Campo de mensagem manual (envia como Sofia)
- Botão "Retomar Sofia"
- Botão "Requer humano"

---

### Documentos (`/knowledge/documents`)

- Tabela com filtros (status, categoria, data)
- Upload (drag-and-drop de arquivo ou URL)
- Badge de status com cor (uploaded/processing/processed/failed)
- Alerta visual para documentos expirados ou expirando em < 7 dias
- Botões: Reprocessar / Arquivar / Ver chunks

---

### Q&A Manual (`/knowledge/qa`)

- Tabela de pares pergunta/resposta
- Modal de criação/edição com categoria, validade
- Bulk import via CSV

---

### Sugestões (`/knowledge/suggestions`)

- Lista de sugestões pendentes (pergunta original + resposta da Sofia)
- Botões: Aprovar (→ cria Q&A manual) / Rejeitar / Editar antes de aprovar
- Filtro por status (pending / approved / rejected)

---

### Providers IA (`/settings/providers`)

- Cards por provider com: nome, tipo, modelo, prioridade, status, circuit breaker
- Switch para ativar/desativar
- Modal de edição (credenciais enviadas mas nunca exibidas)
- Ordem de prioridade via drag-and-drop
- Botão "Testar conexão"

---

### Configurações (`/settings`)

- Threshold atual + gráfico de calibração
- Botão "Recalibrar agora"
- Budget diário/mensal
- Regras de auto-transição do kanban
- Persona da Sofia (prompt base editável)
- Parâmetros do chunker (target_tokens, overlap, min_tokens)

---

## Regras importantes

- Admin Next.js **nunca** acessa Supabase diretamente — sempre via API Fastify
- `NEXT_PUBLIC_API_URL` é a única URL que o frontend conhece
- Autenticação via Supabase Auth (e-mail/senha)

## Histórico de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-06-05 | dnd-kit para kanban (não react-beautiful-dnd) | react-beautiful-dnd descontinuado |
| 2026-06-05 | recharts para dashboard (não Chart.js) | Melhor integração React |
| 2026-06-05 | shadcn/ui (não MUI/Ant Design) | Sem dependência de runtime; fácil customização |
