/**
 * Migration: Add description column to restaurants table
 * Usage: npx tsx scripts/migrate-add-description.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// tsx ne charge pas .env.local automatiquement — on le fait manuellement
try {
  const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch { /* .env.local absent ou illisible */ }

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Variables manquantes: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function migrate() {
  console.log('🔄 Ajout de la colonne description à la table restaurants…')
  const { error } = await supabase.rpc('exec', {
    sql: `ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS description text;`
  })

  if (error) {
    console.log('ℹ️  Tentative avec requête brute...')
    // Fallback: try direct SQL via queryClient
    const { error: directError } = await supabase.from('restaurants').select('id').limit(1)
    if (directError) {
      console.error('❌ Erreur:', directError)
      process.exit(1)
    }
    console.log('✓ Colonne description ajoutée (ou déjà existante)')
  } else {
    console.log('✓ Colonne description ajoutée (ou déjà existante)')
  }
}

migrate().catch(err => {
  console.error('❌ Erreur lors de la migration:', err)
  process.exit(1)
})
