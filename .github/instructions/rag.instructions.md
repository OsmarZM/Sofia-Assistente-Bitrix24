---
applyTo: "packages/rag/**"
---

# RAG Package — Instruções

## Propósito

`packages/rag` contém toda a lógica de Retrieval-Augmented Generation: chunking, retrieval, confidence scoring, cache e geração de prompt.

## Módulos

| Arquivo | Responsabilidade |
|---|---|
| `chunker.ts` | Chunking híbrido (semântico + sliding window) |
| `retriever.ts` | Busca vetorial via RPC `search_knowledge_chunks` |
| `confidence.ts` | Score de confidence + calibração adaptativa |
| `cache.ts` | Cache de respostas por hash SHA-256 (TTL 1h) |
| `prompt.ts` | Persona Sofia + template de prompt com contexto |

## Regras obrigatórias

1. **SEMPRE** usar `search_knowledge_chunks` RPC — NUNCA query direta em `knowledge_chunks`.
2. **Threshold** sempre lido de `confidence_calibration` (nunca hardcoded em runtime).
3. **Embeddings** gerados em batch (não um por um).
4. **Cache**: verificar antes de chamar LLM; salvar resultado após chamada LLM.

## Parâmetros do chunker

```typescript
interface ChunkerOptions {
  targetTokens?: number  // default: 500
  overlapTokens?: number // default: 80
  minTokens?: number     // default: 50
}
```

## Busca RPC

```typescript
import { createClient } from '@sofia/db'

const { data } = await supabase.rpc('search_knowledge_chunks', {
  query_embedding: embedding,  // vector(1536)
  match_threshold: threshold,  // de confidence_calibration
  match_count: 5,
  p_category_id: categoryId ?? null,
})
```

## Referências

- Embeddings: `docs/06-ia-rag/embeddings.md`
- Chunking: `docs/06-ia-rag/chunking.md`
- Retrieval: `docs/06-ia-rag/retrieval.md`
