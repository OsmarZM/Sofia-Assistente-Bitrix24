# Chunking

## Objetivo

Documentar como documentos são divididos em chunks para ingestão.

## Onde fica

`packages/ingestion/src/` — parsers por formato  
`packages/rag/src/chunker.ts` — lógica de chunking

---

## Estratégia híbrida

```
Documento
    │
    ▼
┌─────────────────────────────┐
│  Tem estrutura?             │
│  (headings, slides, seções) │
└─────────────────────────────┘
         │         │
        Sim        Não
         │         │
         ▼         ▼
  Por seções   Texto corrido
         │         │
         └────┬────┘
              ▼
    Seção > 500 tokens?
         │         │
        Sim        Não
         │         │
         ▼         ▼
  Sliding Window  Chunk inteiro
  (sem/overlap    (se < 50 tokens,
   80 tokens)      agrupa com próximo)
```

### Parâmetros

| Parâmetro | Padrão | Descrição |
|---|---|---|
| `targetTokens` | 500 | Tamanho máximo de um chunk |
| `overlapTokens` | 80 | Overlap entre chunks (sliding window) |
| `minTokens` | 50 | Chunk menor que isso é agrupado |

---

## Por tipo de documento

| Formato | Parser | Estratégia de chunking |
|---|---|---|
| PDF | `pdf-parse` | Por parágrafo → sliding se grande |
| DOCX | `mammoth` com headings | Por heading H1/H2/H3 |
| PPTX | — | Por slide |
| URL | `cheerio` + readability | Por parágrafo |
| TXT/Markdown | — | Por linha em branco / heading |
| Q&A Manual | — | 1 chunk = 1 par (preservado integral) |

---

## Metadados por chunk

| Campo | Descrição |
|---|---|
| `document_id` | FK para `knowledge_documents` |
| `category_id` | Categoria para filtragem RAG |
| `chunk_index` | Ordem no documento original |
| `content` | Texto original |
| `embedding` | `vector(1536)` |
| `token_count` | Estimativa de tokens |
| `source_ref` | Página/slide/URL de origem |
| `effective_date` | Validade inicial |
| `expires_at` | Expiração (null = nunca) |

---

## Effective date e expiração

- Herdados do documento pai
- Chunks com `expires_at < now()` são ignorados na busca RPC
- Permite documentos temporários (ex: política de férias 2026)

---

## Histórico de decisões

| Data | Decisão | Motivo |
|---|---|---|
| 2026-06-05 | Overlap de 80 tokens | Evita perda de contexto em chunks adjacentes sem duplicar demais |
| 2026-06-05 | Q&A manual preservado integral | Pergunta + resposta formam contexto indivisível para o LLM |
| 2026-06-05 | Chunks PPTX por slide | Slide é unidade de significado em apresentações |
