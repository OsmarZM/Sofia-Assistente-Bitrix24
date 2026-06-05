# Documentação — Sofia Assistente Virtual

Bem-vindo à documentação técnica completa da Sofia. Cada seção segue o modelo padrão:
**Objetivo → Onde fica → Como funciona → Diagrama → Arquivos → Regras → Checklist → Problemas → Histórico de decisões**.

---

## Índice

| # | Seção | Descrição |
|---|---|---|
| 00 | [Visão Geral](00-visao-geral/README.md) | O que é a Sofia, objetivos, escopo do MVP, glossário |
| 01 | [Arquitetura](01-arquitetura/overview.md) | Diagramas de fluxo, banco de dados, workers, segurança |
| 02 | [Planejamento](02-planejamento/roadmap.md) | Roadmap, fases, checklist MVP, decisões técnicas |
| 03 | [Backend](03-backend/estrutura-pastas.md) | API Fastify, Workers BullMQ, rotas, serviços, variáveis |
| 04 | [Frontend Admin](04-frontend-admin/telas.md) | Telas, componentes, fluxos do painel admin |
| 05 | [Bitrix24](05-bitrix24/integracao.md) | Integração, eventos, envio de mensagens, permissões |
| 06 | [IA e RAG](06-ia-rag/embeddings.md) | Embeddings, chunking, prompts, retrieval, fontes |
| 07 | [Banco de Dados](07-banco/schema.md) | Schema, tabelas, migrations, queries úteis |
| 08 | [Deploy](08-deploy/docker.md) | Docker, Portainer, variáveis, troubleshooting |
| 09 | [Bugs e Soluções](09-bugs-e-solucoes/erros-conhecidos.md) | Erros conhecidos, bugs resolvidos, checklist de debug |
| 10 | [Referências](10-referencias/links.md) | Links externos, comandos úteis |

---

## Skills do agente (Copilot)

| Skill | Quando usar |
|---|---|
| [add-admin-route](skills/add-admin-route.SKILL.md) | Criar nova rota admin completa |
| [add-ai-provider](skills/add-ai-provider.SKILL.md) | Adicionar novo provider de IA |
| [add-knowledge-source](skills/add-knowledge-source.SKILL.md) | Adicionar novo parser de ingestão |
| [add-migration](skills/add-migration.SKILL.md) | Criar nova migration SQL |
| [debug-bitrix-webhook](skills/debug-bitrix-webhook.SKILL.md) | Diagnosticar integração Bitrix24 |
| [tune-confidence](skills/tune-confidence.SKILL.md) | Calibrar threshold de confiança |
| [deploy-to-portainer](skills/deploy-to-portainer.SKILL.md) | Publicar stack no Portainer |

---

## Modelo padrão de página

Cada arquivo de documentação segue esta estrutura:

```markdown
# Nome da Página

## Objetivo
O que essa parte faz.

## Onde fica
`apps/api/src/...` ou `packages/...`

## Como funciona
Descrição do fluxo principal.

## Diagrama
\`\`\`mermaid
flowchart TD
  A[Entrada] --> B[Processamento] --> C[Saída]
\`\`\`

## Arquivos relacionados
- `arquivo-1.ts`
- `arquivo-2.ts`

## Regras importantes
- Regra 1
- Regra 2

## Checklist
- [ ] Implementado
- [ ] Testado
- [ ] Documentado

## Problemas conhecidos
| Erro | Causa | Solução |
|---|---|---|
| ... | ... | ... |

## Histórico de decisões
| Data | Decisão | Motivo |
|---|---|---|
| 2026-06-05 | ... | ... |
```
