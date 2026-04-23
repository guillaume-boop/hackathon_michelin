/**
 * Update all feed videos avec une nouvelle URL
 * Usage: npx tsx scripts/update-feed-videos.ts
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
const VIDEO_URL = process.env.VIDEO_URL!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Variables manquantes: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises')
  process.exit(1)
}

if (!VIDEO_URL) {
  console.error('❌ VIDEO_URL manquante dans .env.local')
  console.error('   Ajoute: VIDEO_URL=https://...')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function updateVideos() {
  console.log(`🎬 Update de tous les feed posts avec:\n   ${VIDEO_URL}\n`)

  const { data, error } = await supabase
    .from('feed_posts')
    .update({ content_url: VIDEO_URL })
    .neq('id', '00000000-0000-0000-0000-000000000000')
    .select('id')

  if (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }

  console.log(`✅ ${data.length} feed posts mis à jour`)
}

updateVideos().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})
