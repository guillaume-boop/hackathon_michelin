/**
 * Migration: Ajoute les colonnes CSV à la table restaurants
 * Usage: npx tsx scripts/migrate-csv-columns.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

try {
  const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch { /* ignore */ }

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Variables manquantes: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const COLUMNS = [
  'ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address text;',
  'ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cuisine text;',
  'ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS price_range text;',
  'ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone_number text;',
  'ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS michelin_url text;',
  'ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS website_url text;',
  'ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS facilities text;',
]

const SQL = COLUMNS.join('\n')

async function migrate() {
  console.log('🔄 Migration: ajout des colonnes CSV à restaurants…\n')

  const { error } = await supabase.rpc('exec', { sql: SQL })

  if (error) {
    console.log('⚠️  Le RPC exec n\'est pas disponible. Lance ce SQL manuellement dans le dashboard Supabase:\n')
    console.log('─'.repeat(60))
    console.log(SQL)
    console.log('─'.repeat(60))
    console.log('\nEnsuite relance: npx tsx scripts/import-csv.ts')
    process.exit(0)
  }

  console.log('✅ Colonnes ajoutées:')
  COLUMNS.forEach(c => console.log(' ', c.replace('ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS ', '').replace(';', '')))
}

migrate().catch(err => {
  console.error('❌', err)
  process.exit(1)
})
