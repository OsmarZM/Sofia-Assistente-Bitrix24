import { createClient } from '@supabase/supabase-js'
import type { Database } from './types.generated.js'

const supabaseUrl = process.env['SUPABASE_URL']
const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

export const db = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
})
