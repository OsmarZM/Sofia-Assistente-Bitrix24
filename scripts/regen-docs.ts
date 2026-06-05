/**
 * scripts/regen-docs.ts
 *
 * Fonte única da verdade: lê supabase/migrations e regenera:
 *  - docs/schema.md            (ERD em texto + descrições)
 *  - packages/db/src/types.generated.ts (tipos TS)
 *  - .agents/skills/sofia-schema/SKILL.md
 *  - .agents/skills/sofia-rag/SKILL.md
 *  - tests/contract/schema.test.ts
 *  - supabase/schema.json (snapshot)
 *
 * Disparado por: pre-commit (quando migrations mudam) e CI.
 */

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = path.resolve(import.meta.dirname, '..')
const MIGRATIONS_DIR = path.join(ROOT, 'supabase', 'migrations')
const DOCS_DIR = path.join(ROOT, 'docs')
const SKILLS_DIR = path.join(ROOT, '.agents', 'skills')
const TESTS_DIR = path.join(ROOT, 'tests', 'contract')
const DB_TYPES_PATH = path.join(ROOT, 'packages', 'db', 'src', 'types.generated.ts')
const SCHEMA_JSON_PATH = path.join(ROOT, 'supabase', 'schema.json')

// ── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

function write(filePath: string, content: string) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf8')
  console.log(`  ✓ ${path.relative(ROOT, filePath)}`)
}

/** Extrai nomes de tabelas do SQL de migrations */
function extractTables(sql: string): string[] {
  const re = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?["']?(\w+)["']?\s*\(/gi
  const tables: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(sql)) !== null) {
    if (m[1] && !tables.includes(m[1])) tables.push(m[1])
  }
  return tables
}

/** Extrai colunas de uma tabela específica */
function extractColumns(sql: string, tableName: string): string[] {
  const tableRe = new RegExp(
    `CREATE TABLE\\s+(?:IF NOT EXISTS\\s+)?["']?${tableName}["']?\\s*\\(([^;]+?)\\);`,
    'is'
  )
  const match = tableRe.exec(sql)
  if (!match?.[1]) return []
  return match[1]
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('--') && !l.startsWith('UNIQUE') && !l.startsWith('CHECK') && !l.startsWith('CONSTRAINT') && !l.startsWith('PRIMARY') && !l.startsWith('FOREIGN'))
    .map((l) => l.split(/\s+/)[0]?.replace(/[",]/g, '') ?? '')
    .filter(Boolean)
}

// ── Read all migrations ───────────────────────────────────────────────────────

const migrationFiles = fs
  .readdirSync(MIGRATIONS_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort()

const fullSql = migrationFiles
  .map((f) => fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8'))
  .join('\n\n')

const tables = extractTables(fullSql)
console.log(`\n📋 Tables found (${tables.length}): ${tables.join(', ')}\n`)

// ── 1. docs/schema.md ────────────────────────────────────────────────────────

const schemaDoc = `# Sofia Assistente Virtual — Schema do Banco de Dados

> **Gerado automaticamente** a partir de \`supabase/migrations/\`. Não edite manualmente.
> Última geração: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}

## Tabelas (${tables.length})

${tables.map((t) => {
  const cols = extractColumns(fullSql, t)
  return `### \`${t}\`\n\nColunas: ${cols.map((c) => `\`${c}\``).join(', ')}\n`
}).join('\n')}

## Diagrama de relacionamentos

\`\`\`mermaid
erDiagram
  knowledge_documents ||--o{ knowledge_chunks : "tem"
  knowledge_chunks }o--|| knowledge_categories : "pertence a"
  knowledge_documents }o--|| knowledge_categories : "pertence a"
  knowledge_manual_qa }o--|| knowledge_categories : "pertence a"
  knowledge_suggestions }o--|| chat_sessions : "originada de"
  knowledge_suggestions ||--o{ knowledge_approvals : "aprovada por"
  chat_sessions ||--o{ chat_messages : "contém"
  chat_sessions }o--|| conversation_phases : "está em"
  chat_sessions ||--o{ conversation_phase_transitions : "transitou"
  chat_sessions ||--o{ admin_interventions : "intervenção"
  chat_messages }o--|| ai_providers : "usado por"
  ai_providers ||--o{ ai_provider_health : "saúde"
  ai_providers ||--o{ ai_pricing : "preços"
  ai_providers ||--o{ response_cache : "cacheado por"
\`\`\`
`

write(path.join(DOCS_DIR, 'schema.md'), schemaDoc)

// ── 2. supabase/schema.json (snapshot) ───────────────────────────────────────

const schemaSnapshot = {
  generated_at: new Date().toISOString(),
  tables: Object.fromEntries(tables.map((t) => [t, extractColumns(fullSql, t)])),
}
write(SCHEMA_JSON_PATH, JSON.stringify(schemaSnapshot, null, 2))

// ── 3. packages/db/src/types.generated.ts ────────────────────────────────────

const typesContent = `// GERADO AUTOMATICAMENTE — não edite
// Fonte: supabase/migrations/
// Última geração: ${new Date().toISOString()}
//
// Para tipos completos e validados, use o Supabase CLI:
//   npx supabase gen types typescript --project-id eeswigmlasmblrrvemzw > packages/db/src/types.generated.ts

export type Database = {
  public: {
    Tables: {
${tables.map((t) => {
  const cols = extractColumns(fullSql, t)
  return `      ${t}: {
        Row: { ${cols.map((c) => `${c}: unknown`).join('; ')} }
        Insert: { ${cols.map((c) => `${c}?: unknown`).join('; ')} }
        Update: { ${cols.map((c) => `${c}?: unknown`).join('; ')} }
      }`
}).join('\n')}
    }
    Functions: {
      advance_session_phase: {
        Args: { p_session_id: string; p_from_slug: string; p_to_slug: string; p_actor?: string; p_reason?: string }
        Returns: void
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
`

write(DB_TYPES_PATH, typesContent)

// ── 4. .agents/skills/sofia-schema/SKILL.md ─────────────────────────────────

const schemaSkill = `---
applyTo: "**/*.ts,supabase/**"
---
# Skill: sofia-schema

> **Gerado automaticamente**. Última geração: ${new Date().toISOString()}

## Banco de dados: Sofia Assistente Virtual (Supabase PostgreSQL + pgvector)

### Tabelas disponíveis (${tables.length})

${tables.map((t) => {
  const cols = extractColumns(fullSql, t)
  return `- **\`${t}\`** — ${cols.slice(0, 6).map((c) => `\`${c}\``).join(', ')}${cols.length > 6 ? ` ... +${cols.length - 6} cols` : ''}`
}).join('\n')}

### Padrões de acesso

\`\`\`typescript
import { db } from '@sofia/db'

// Busca vetorial
const { data } = await db
  .from('knowledge_chunks')
  .select('id, content, embedding <=> $1::vector as score')
  .order('score')
  .limit(6)

// Upsert de usuário Bitrix
await db.from('users').upsert(
  { bitrix_user_id: id, name, updated_at: new Date().toISOString() },
  { onConflict: 'bitrix_user_id' }
)

// Avançar fase do kanban (via função SQL)
await db.rpc('advance_session_phase', {
  p_session_id: sessionId,
  p_from_slug: 'nova',
  p_to_slug: 'em-andamento',
})
\`\`\`

### Convenções
- Todas as PKs são UUID (\`uuid_generate_v4()\`)
- \`created_at\` e \`updated_at\` em TIMESTAMPTZ
- Soft-delete via \`status = 'archived'\`, nunca DELETE
- Embeddings: \`vector(1536)\` — OpenAI text-embedding-3-small
- RLS desabilitado no MVP (single-tenant); habilitar via migração futura
`

write(path.join(SKILLS_DIR, 'sofia-schema', 'SKILL.md'), schemaSkill)

// ── 5. .agents/skills/sofia-rag/SKILL.md ─────────────────────────────────────

const ragSkill = `---
applyTo: "packages/rag/**,packages/ai-providers/**"
---
# Skill: sofia-rag

> **Gerado automaticamente**. Última geração: ${new Date().toISOString()}

## Pipeline RAG da Sofia

### Fluxo completo
\`\`\`
Pergunta do usuário
  → embed(pergunta)                    # text-embedding-3-small (1536d)
  → retrieve(embedding, { topK: 6 })  # pgvector cosine similarity
  → isConfident(chunks)               # threshold adaptativo de confidence_calibration
  → buildPrompt(ctx)                  # persona Sofia + chunks + histórico
  → ProviderRouter.chat(messages)     # failover: OpenAI → Azure → Anthropic → ...
  → response + sources                # resposta com citação de fontes
  → persist(chat_messages)            # tokens, custo, latência, confidence
\`\`\`

### Estratégia de chunking
- Semântico por heading/seção (H1/H2/H3) — primeiro
- Sliding window (target 500 tokens, overlap 80) — fallback para seções grandes
- Merge para seções pequenas (<150 tokens)

### Threshold de confidence (adaptativo)
- Lido de \`confidence_calibration.current_threshold\`
- Recalibrado após cada N feedbacks (👍/👎)
- Default bootstrap: 0.5 (modo permissivo)
- Resposta quando confiança baixa: "Não encontrei informações suficientes..."

### Multi-provider (ProviderRouter)
- Ordem de failover definida por \`ai_providers.priority\` (menor = maior prioridade)
- Circuit breaker: 5 falhas/60s → pausa 5min → half-open
- Cache de resposta em \`response_cache\` (TTL 1h, hash por pergunta + chunk IDs)
`

write(path.join(SKILLS_DIR, 'sofia-rag', 'SKILL.md'), ragSkill)

// ── 6. tests/contract/schema.test.ts ─────────────────────────────────────────

const contractTest = `// GERADO AUTOMATICAMENTE — não edite
// Verifica que todas as tabelas esperadas existem no banco
// Última geração: ${new Date().toISOString()}

import { describe, it, expect, beforeAll } from 'vitest'
import { db } from '@sofia/db'

const EXPECTED_TABLES = ${JSON.stringify(tables, null, 2)} as const

describe('Schema Contract', () => {
  let existingTables: string[] = []

  beforeAll(async () => {
    const { data, error } = await db
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE')
    if (error) throw error
    existingTables = (data ?? []).map((r: { table_name: string }) => r.table_name)
  })

  for (const table of EXPECTED_TABLES) {
    it(\`table "\${table}" exists\`, () => {
      expect(existingTables).toContain(table)
    })
  }
})
`

write(path.join(TESTS_DIR, 'schema.test.ts'), contractTest)

// ── Done ─────────────────────────────────────────────────────────────────────

console.log('\n✅ regen-docs concluído\n')
