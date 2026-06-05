# Decisões Técnicas (ADRs)

Registro das principais decisões de arquitetura (Architecture Decision Records simplificados).

---

## ADR-001: Sofia como usuário real do Bitrix24 (não bot)

**Data**: 2026-06-05  
**Status**: Aceito

**Contexto**: Bitrix24 oferece API de bot/copilot nativa, mas com limitações de interface.

**Decisão**: Criar a Sofia como usuário real (conta de funcionário) no Bitrix24.

**Motivo**: Usuário real aparece em todos os tipos de chat, tem histórico normal, recebe reações, pode ser mencionado com @Sofia. Mais natural para colaboradores.

**Consequência**: Necessário gerenciar um usuário Bitrix adicional. `BITRIX_SOFIA_USER_ID` usado para ignorar mensagens da própria Sofia (evitar loops).

---

## ADR-002: Multi-provider IA desde o MVP

**Data**: 2026-06-05  
**Status**: Aceito

**Contexto**: OpenAI pode ter instabilidade, mudanças de preço ou rate limits.

**Decisão**: Abstração `ProviderRouter` com cadeia OpenAI → Azure OpenAI → Anthropic → Grok → Gemini, configurável em runtime via painel admin.

**Motivo**: Evitar lock-in; resiliência de custo; circuit breaker por provider.

---

## ADR-003: Chunking híbrido (semântico + sliding window)

**Data**: 2026-06-05  
**Status**: Aceito

**Decisão**: Chunker tenta estrutura (headings, slides) primeiro; se seção > 500 tokens, aplica sliding window com overlap 80 tokens; se < 150 tokens, agrupa com adjacente.

**Motivo**: Chunks fixos de 500 tokens perdem contexto em documentos com seções variadas. Headings delimitam naturalmente o escopo de cada informação.

---

## ADR-004: Threshold adaptativo (não fixo)

**Data**: 2026-06-05  
**Status**: Aceito

**Decisão**: Threshold inicial 0.5 (bootstrap). Recalibrado automaticamente a cada 20 feedbacks usando percentil F1-ótimo.

**Motivo**: Threshold fixo 0.35 pode gerar muitas respostas erradas; 0.8 pode gerar muitos "não sei". O valor ideal depende do conteúdo da base.

---

## ADR-005: RLS default-deny (sem policies)

**Data**: 2026-06-05  
**Status**: Aceito

**Decisão**: Habilitar RLS em todas as tabelas sem criar policies. Acesso somente via `service_role`.

**Motivo**: Admin Next.js nunca acessa Supabase diretamente. Toda lógica de acesso fica na API Fastify com `service_role`. Sem policies = zero risco de policy mal configurada abrir dados.

---

## ADR-006: AES-256-GCM para credenciais de providers

**Data**: 2026-06-05  
**Status**: Aceito

**Decisão**: Coluna `ai_providers.config` cifrada com AES-256-GCM. Chave em `CREDENTIAL_ENCRYPTION_KEY` (nunca no banco).

**Motivo**: Vazamento do banco não expõe API keys dos providers de IA.

---

## ADR-007: Monorepo pnpm workspaces (não Nx/Turborepo)

**Data**: 2026-06-05  
**Status**: Aceito

**Decisão**: pnpm workspaces puro, sem ferramenta de build adicional.

**Motivo**: Projeto pequeno (1 equipe, 1 empresa). Overhead de Nx/Turborepo não justificado. pnpm workspaces + TypeScript project references suficientes.

---

## ADR-008: Deploy via docker-compose (não Kubernetes)

**Data**: 2026-06-05  
**Status**: Aceito

**Decisão**: Docker Compose gerenciado pelo Portainer.

**Motivo**: Single-tenant, escala previsível, equipe pequena. Kubernetes é over-engineering para o volume atual.
