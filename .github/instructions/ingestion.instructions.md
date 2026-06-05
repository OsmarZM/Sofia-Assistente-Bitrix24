---
applyTo: "packages/ingestion/**"
---

# Ingestion Package — Instruções

## Propósito

`packages/ingestion` implementa o pipeline de ingestão de documentos: parse → chunk → embed → insert.

## Parsers disponíveis

| Arquivo | Formato | Lib |
|---|---|---|
| `parsers/pdf.ts` | PDF | `pdf-parse` |
| `parsers/docx.ts` | DOCX | `mammoth` |
| `parsers/pptx.ts` | PPTX | `pptx-parser` |
| `parsers/url.ts` | URL/HTML | `cheerio` + `@mozilla/readability` |
| `parsers/txt.ts` | TXT/Markdown | nativo |

## Fluxo

```
pipeline.ts
  → detectFormat(document)
  → parser[format].parse(source)
  → chunker.chunk(text, options)
  → openai.embeddings.create(batch)
  → supabase.from('knowledge_chunks').insert(chunks)
  → document.status = 'processed'
```

## Regras obrigatórias

1. **Status tracking**: atualizar `knowledge_documents.status` em cada etapa.
2. **Erro**: salvar `error_msg` e setar `status = 'failed'` — nunca deixar em `processing`.
3. **`effective_date`/`expires_at`**: propagar do documento para todos os chunks.
4. **Batch embeddings**: máximo 100 textos por chamada à OpenAI.
5. **URL leve**: cheerio/readability apenas; não usar Playwright exceto se explicitamente necessário.

## Adicionando novo formato

Ver `docs/skills/add-knowledge-source.SKILL.md`.

## Referências

- Chunking: `docs/06-ia-rag/chunking.md`
- Fontes suportadas: `docs/06-ia-rag/fontes.md`
