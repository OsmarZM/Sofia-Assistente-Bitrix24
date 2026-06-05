---
description: "Guia passo a passo para adicionar uma nova fonte de conhecimento à Sofia: novo tipo de arquivo, nova categoria ou nova fonte de dados. Use ao expandir a base de conhecimento além dos formatos já suportados."
---

# Skill: Adicionar Fonte de Conhecimento

## Quando usar

- Adicionar suporte a novo formato de arquivo (ex: XLSX, CSV, JSON)
- Adicionar nova categoria de conhecimento
- Configurar ingestão automática de fonte externa (ex: Confluence, Notion)

---

## Opção 1: Adicionar novo formato de arquivo

### Passo 1: Criar o parser

```bash
packages/ingestion/src/parsers/xlsx.ts
```

```typescript
// packages/ingestion/src/parsers/xlsx.ts
import * as XLSX from 'xlsx'

export async function parseXlsx(buffer: Buffer): Promise<string> {
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const texts: string[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const csv = XLSX.utils.sheet_to_csv(sheet)
    texts.push(`## Aba: ${sheetName}\n${csv}`)
  }

  return texts.join('\n\n')
}
```

### Passo 2: Registrar no pipeline

Em `packages/ingestion/src/pipeline.ts`:

```typescript
import { parseXlsx } from './parsers/xlsx.js'

// No switch de source_type:
case 'xlsx':
  text = await parseXlsx(fileBuffer)
  break
```

### Passo 3: Adicionar ao enum de source_type

Criar migration:

```sql
-- supabase/migrations/0005_add_xlsx_source_type.sql
ALTER TABLE knowledge_documents
  DROP CONSTRAINT IF EXISTS knowledge_documents_source_type_check;

ALTER TABLE knowledge_documents
  ADD CONSTRAINT knowledge_documents_source_type_check
  CHECK (source_type IN ('pdf', 'docx', 'pptx', 'url', 'txt', 'manual_qa', 'xlsx'));
```

---

## Opção 2: Adicionar nova categoria de conhecimento

```sql
-- Via SQL (Supabase Dashboard ou migration)
INSERT INTO knowledge_categories (id, name, slug, description, icon, color)
VALUES (
  gen_random_uuid(),
  'Contratos e Jurídico',
  'contracts',
  'Contratos, termos e documentos jurídicos da empresa',
  'scale',
  '#dc2626'
);
```

Ou via painel admin: **Documentos → Gerenciar Categorias → Nova Categoria**

---

## Opção 3: Upload via painel admin (formatos já suportados)

1. Painel admin → **Documentos** → **Adicionar**
2. Selecionar arquivo (PDF/DOCX/PPTX/TXT) ou colar URL
3. Escolher categoria
4. Definir `effective_date` e `expires_at` se aplicável
5. Clicar **Processar**
6. Aguardar status mudar para `processed`

---

## Opção 4: Import em lote via API

```bash
# Upload de múltiplos documentos
for file in *.pdf; do
  curl -X POST http://localhost:3001/admin/documents \
    -H "Authorization: Bearer $TOKEN" \
    -F "file=@$file" \
    -F "category_id=UUID_DA_CATEGORIA" \
    -F "title=$file"
done
```

---

## Checklist nova fonte

- [ ] Parser criado em `packages/ingestion/src/parsers/`
- [ ] Registrado no `pipeline.ts`
- [ ] Enum atualizado (migration se necessário)
- [ ] Testado com arquivo real
- [ ] Status `processed` após ingestão
- [ ] Chunks visíveis no Supabase Dashboard
- [ ] Busca RAG funcionando com os novos chunks

## Referências

- Chunking: `docs/06-ia-rag/chunking.md`
- Pipeline: `packages/ingestion/src/pipeline.ts`
- Parsers existentes: `packages/ingestion/src/parsers/`
- Skill nova migration: `docs/skills/add-migration.SKILL.md`
