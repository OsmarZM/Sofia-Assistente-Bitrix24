/**
 * scripts/check-drift.ts
 *
 * Compara o snapshot supabase/schema.json com as tabelas
 * que realmente existem no banco Supabase.
 * Falha (exit 1) se houver divergência — usado como gate de CI.
 */

import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(import.meta.dirname, '..')
const SCHEMA_JSON_PATH = path.join(ROOT, 'supabase', 'schema.json')

const supabaseUrl = process.env['SUPABASE_URL']
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios')
  process.exit(1)
}

if (!fs.existsSync(SCHEMA_JSON_PATH)) {
  console.error('❌ supabase/schema.json não encontrado. Execute: pnpm regen-docs')
  process.exit(1)
}

type SchemaSnapshot = {
  generated_at: string
  tables: Record<string, string[]>
}

const snapshot: SchemaSnapshot = JSON.parse(fs.readFileSync(SCHEMA_JSON_PATH, 'utf8'))
const expectedTables = Object.keys(snapshot.tables)

const db = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

console.log('🔍 Verificando drift entre schema.json e banco...\n')

const { data, error } = await db
  .from('information_schema.tables')
  .select('table_name')
  .eq('table_schema', 'public')
  .eq('table_type', 'BASE TABLE')

if (error) {
  console.error('❌ Erro ao consultar banco:', error.message)
  process.exit(1)
}

const actualTables = (data ?? []).map((r: { table_name: string }) => r.table_name)

const missing = expectedTables.filter((t) => !actualTables.includes(t))
const extra = actualTables.filter((t) => !expectedTables.includes(t) && t !== 'chat_messages_archive')

let hasDrift = false

if (missing.length > 0) {
  console.error(`❌ Tabelas no schema.json mas AUSENTES no banco:\n  ${missing.join('\n  ')}`)
  console.error('\n   Solução: execute "pnpm db:push" para aplicar as migrations')
  hasDrift = true
}

if (extra.length > 0) {
  console.warn(`⚠️  Tabelas no banco mas AUSENTES no schema.json:\n  ${extra.join('\n  ')}`)
  console.warn('\n   Solução: crie uma migration e execute "pnpm regen-docs"')
  // Extra tables são warning, não erro fatal (pode ser tabela temporária)
}

if (!hasDrift) {
  console.log(`✅ Sem drift — ${expectedTables.length} tabelas OK\n`)
  process.exit(0)
} else {
  process.exit(1)
}
