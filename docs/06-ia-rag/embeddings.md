# Embeddings e Modelo Vetorial

## Objetivo

Documentar como os embeddings são gerados, armazenados e buscados.

## Onde fica

- `packages/rag/src/retriever.ts` — busca pgvector
- `packages/rag/src/chunker.ts` — geração de embeddings
- `supabase/migrations/0001_init.sql` — coluna `embedding vector(1536)` + índice IVFFlat
- `supabase/migrations/0002_search_rpc.sql` — função `search_knowledge_chunks`

---

## Modelo de embedding

| Parâmetro | Valor |
|---|---|
| Provider | OpenAI |
| Modelo | `text-embedding-3-small` |
| Dimensões | 1536 |
| Métrica de distância | `cosine` (pgvector `<=>`) |

---

## Geração

```typescript
// packages/rag/src/chunker.ts
const response = await openai.embeddings.create({
  model: process.env.OPENAI_MODEL_EMBED ?? 'text-embedding-3-small',
  input: chunkTexts,  // batch de até 100 textos
  encoding_format: 'float',
})
```

Embeddings gerados em batch para reduzir custo e latência.

---

## Armazenamento

Coluna `embedding vector(1536)` em `knowledge_chunks`:

```sql
-- Índice IVFFlat para busca vetorial rápida
CREATE INDEX knowledge_chunks_embedding_idx
ON knowledge_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

`lists = 100` é ideal para bases de ~100k chunks.

---

## Busca (RPC)

```sql
-- supabase/migrations/0002_search_rpc.sql
CREATE FUNCTION search_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.35,
  match_count int DEFAULT 5,
  p_category_id uuid DEFAULT NULL
)
RETURNS TABLE (...)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
```

Uso na aplicação:
```typescript
const { data } = await supabase.rpc('search_knowledge_chunks', {
  query_embedding: embedding,
  match_threshold: threshold,
  match_count: 5,
  p_category_id: categoryId ?? null,
})
```

---

## Threshold adaptativo

Ver `packages/rag/src/confidence.ts` e `docs/06-ia-rag/retrieval.md`.

- Threshold inicial: 0.5 (bootstrap)
- Recalibrado automaticamente pelo job `recalibrate-threshold`
- Armazenado em `confidence_calibration.current_threshold`

---

## Custo estimado

| Operação | Preço (2026) |
|---|---|
| text-embedding-3-small | $0.02 / 1M tokens |
| Chunk médio de 400 tokens | ~$0.000008 |
| 1000 documentos com avg 50 chunks | ~$0.40 total |

## Histórico de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-06-05 | text-embedding-3-small (não large) | 5x mais barato; qualidade suficiente para este domínio |
| 2026-06-05 | IVFFlat (não HNSW) | pgvector < 0.7 (sem suporte HNSW em Supabase); atualizar quando disponível |
| 2026-06-05 | Batch de embeddings (não 1 por 1) | Rate limit de 100 req/min na OpenAI tier 1 |
