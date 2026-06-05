# Erros Conhecidos e Soluções

## Objetivo

Registro de erros encontrados durante o desenvolvimento e suas soluções.

---

## DNS/IPv6: `ENOTFOUND db.eeswigmlasmblrrvemzw.supabase.co`

**Sintoma**:
```
Error: getaddrinfo ENOTFOUND db.eeswigmlasmblrrvemzw.supabase.co
```

**Causa**: A máquina de desenvolvimento resolve o hostname Supabase para IPv6 (`::1` ou similar), que não é suportado pelo cliente PostgreSQL nativo em alguns ambientes Windows.

**Solução**: Usar **MCP Supabase** (`mcp_supabase_apply_migration`) em vez de `psql` direto para aplicar migrations. O MCP usa a API REST do Supabase que funciona independente de DNS.

**Verificação**:
```powershell
Resolve-DnsName db.eeswigmlasmblrrvemzw.supabase.co
# Se retornar IPv6 apenas → usar MCP
```

---

## Pooler: `tenant or user not found`

**Sintoma**:
```
NeonDbError: tenant or user not found
```

**Causa**: O connection pooler do Supabase usa session mode diferente do transaction mode para certos tipos de query.

**Solução**: Usar `db.eeswigmlasmblrrvemzw.supabase.co` (direct connection) em vez do pooler `aws-0-sa-east-1.pooler.supabase.com` para migrations. Para a API em produção, o pooler é aceitável.

---

## Bug na RPC `search_knowledge_chunks`: `kd.category_id` → `kc.category_id`

**Sintoma**:
```sql
ERROR: column kd.category_id does not exist
```

**Causa**: No join da migration `0002_search_rpc.sql`, o alias correto para `knowledge_categories` é `kc`, não `kd` (que é `knowledge_documents`).

**Solução**: A migration `0002_search_rpc.sql` foi corrigida para usar `kc.category_id`. Reaplicar via MCP se o banco mostrar o erro antigo.

---

## `pnpm install` falha: peer deps não resolvidos

**Sintoma**:
```
 ERR_PNPM_PEER_DEP_ISSUES  Unmet peer dependencies
```

**Solução**:
```bash
pnpm install --legacy-peer-deps
# ou adicionar ao .npmrc:
legacy-peer-deps=true
```

---

## Next.js 14: `useSearchParams` sem Suspense boundary

**Sintoma**:
```
Error: Missing Suspense boundary with useSearchParams
```

**Solução**: Envolver o componente que usa `useSearchParams` em `<Suspense>`:
```tsx
<Suspense fallback={<Loading />}>
  <ComponenteComSearchParams />
</Suspense>
```

---

## Worker BullMQ: jobs ficam em estado `stalled`

**Sintoma**: Jobs aparecem como `stalled` no Redis após restart do worker.

**Causa**: Worker travou sem completar o job; BullMQ mantém o estado por `lockDuration`.

**Solução**:
```bash
# Via Redis CLI
redis-cli> ZRANGE bull:bitrix-message:stalled 0 -1
# Remove jobs stalled
redis-cli> DEL bull:bitrix-message:stalled
```

---

## Supabase CLI: `supabase login` sem browser

**Sintoma**: `supabase login` tenta abrir browser mas falha em ambiente headless.

**Solução**:
```bash
supabase login --token <seu-access-token>
# Token em: https://app.supabase.io/account/tokens
```

---

## Arquivo `.env` com BOM (UTF-8 with BOM)

**Sintoma**: Variáveis de ambiente com caractere `ï»¿` no início.

**Causa**: Editor salvou arquivo `.env` com BOM.

**Solução**: Salvar `.env` como `UTF-8 without BOM` no VS Code (canto inferior direito → encoding).
