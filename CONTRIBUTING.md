# Guia de Contribuição — Sofia Assistente Virtual

## Antes de começar

1. Leia o [README.md](README.md) para entender a arquitetura
2. Leia o [SECURITY.md](SECURITY.md) para entender o modelo de segurança
3. Instale: Node.js 20+, pnpm 9+, Docker Desktop

---

## Setup do ambiente de desenvolvimento

```bash
git clone https://github.com/OsmarZM/Sofia-Assistente-Bitrix24.git
cd Sofia-Assistente-Bitrix24
pnpm install
cp .env.example .env
# Preencha as variáveis obrigatórias no .env
```

---

## Convenção de commits (Conventional Commits)

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/) — commitlint está configurado e rejeita commits fora do padrão.

### Formato

```
<tipo>(<escopo>): <descrição curta em pt-BR ou en>

[corpo opcional]

[rodapé opcional: BREAKING CHANGE, closes #N]
```

### Tipos aceitos

| Tipo | Quando usar |
|---|---|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Apenas documentação |
| `style` | Formatação (sem mudança de lógica) |
| `refactor` | Refatoração sem feat/fix |
| `test` | Adicionar/corrigir testes |
| `chore` | Build, CI, dependências |
| `migration` | Nova migration SQL |
| `security` | Melhoria de segurança |

### Exemplos

```bash
git commit -m "feat(rag): adicionar reranking MMR ao retriever"
git commit -m "fix(bitrix): corrigir loop em mensagens de evento ONIMJOINCHAT"
git commit -m "migration: adicionar tabela knowledge_tags (0005)"
git commit -m "security: rotacionar CREDENTIAL_ENCRYPTION_KEY"
git commit -m "docs(07-banco): documentar queries de auditoria"
```

---

## Model de branches

| Branch | Propósito |
|---|---|
| `main` | Produção — protegida, merge via PR |
| `dev` | Desenvolvimento ativo |
| `feat/<nome>` | Nova funcionalidade |
| `fix/<nome>` | Correção de bug |
| `docs/<nome>` | Documentação |
| `hotfix/<nome>` | Correção urgente em produção |

---

## Regras de migration SQL

1. **Sempre criar novo arquivo** em `supabase/migrations/` — nunca editar migrations existentes
2. **Nomear** como `NNNN_descricao_snake_case.sql` (ex: `0005_add_knowledge_tags.sql`)
3. **Toda nova tabela** deve ter `ENABLE ROW LEVEL SECURITY` no mesmo arquivo
4. **Toda nova função** deve ter `SET search_path = public, pg_catalog`
5. **Executar regen-docs** após migrations: `pnpm regen-docs`

---

## Pre-commit hooks

O Husky executará automaticamente antes de cada commit:

1. **lint-staged** — ESLint + Prettier nos arquivos staged
2. **check-migrations** — se `supabase/migrations/**` mudou, executa `regen-docs`

Se o hook falhar, corrija o erro e faça commit novamente.

---

## Checklist de PR

Antes de abrir um Pull Request:

- [ ] `pnpm lint` passa sem erros
- [ ] `pnpm typecheck` passa sem erros
- [ ] `pnpm test` passa (quando aplicável)
- [ ] `pnpm check-drift` retorna 0 (schema em sincronia)
- [ ] Novas tabelas têm RLS habilitada
- [ ] Novas funções têm `search_path` fixo
- [ ] Mutações administrativas chamam `logAudit`
- [ ] Credenciais de providers são cifradas com `encryptJSON` antes de gravar
- [ ] Documentação em `docs/` atualizada (se a mudança afetar comportamento externo)
- [ ] Descrição do PR explica o porquê da mudança

---

## Regras de código

### Obrigatório

- TypeScript strict mode — sem `any` implícito
- ESM (`import/export`) — sem `require()`
- Validação Zod em todas as bordas (requisições HTTP, eventos BullMQ)
- `service_role` somente no backend (API/Worker) — nunca expor ao admin Next.js
- `logAudit` em toda mutação administrativa
- Credenciais de providers sempre cifradas com `encryptJSON`

### Idiomas

- **Código / comentários / variáveis**: inglês (`camelCase`)
- **Mensagens de UI / erros para usuário**: português brasileiro
- **Commits / PRs / Issues**: pode ser pt-BR ou en

### Formatação

- Prettier cuida da formatação — não discuta estilo, rode `pnpm format`
- ESLint cuida das regras — veja `.eslintrc.js`

---

## Dúvidas?

Abra uma [Issue](https://github.com/OsmarZM/Sofia-Assistente-Bitrix24/issues) com a label `question`.
