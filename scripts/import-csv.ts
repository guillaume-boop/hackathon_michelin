/**
 * Import CSV Michelin → Supabase
 * Pose ton fichier .csv ou .tsv dans scripts/ puis: npx tsx scripts/import-csv.ts
 *
 * - Détecte automatiquement le CSV dans scripts/
 * - Format attendu: TSV (tabulation) avec headers Michelin
 * - Génère 10 feed posts vidéo par restaurant automatiquement
 * - Vide la table restaurants avant d'importer (propre)
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve, join } from 'path'

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

const VIDEO_URL = 'https://avtshare01.rz.tu-ilmenau.de/avt-vqdb-uhd-1/test_1/segments/bigbuck_bunny_8bit_7500kbps_1080p_60.0fps_h264.mp4'

const BATCH_SIZE = 50
const POSTS_PER_RESTAURANT = 10
const SCRIPTS_DIR = join(process.cwd(), 'scripts')

// ── Parsing ────────────────────────────────────────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.replace(/\r/g, '').split('\n')

  function splitLine(line: string): string[] {
    const fields: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++ }
        else if (ch === '"') inQuotes = false
        else cur += ch
      } else {
        if (ch === '"') inQuotes = true
        else if (ch === ',') { fields.push(cur); cur = '' }
        else cur += ch
      }
    }
    fields.push(cur)
    return fields
  }

  const nonEmpty = lines.filter(l => l.trim())
  const headers = splitLine(nonEmpty[0]).map(h => h.trim())
  return nonEmpty.slice(1).map(line => {
    const values = splitLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, (values[i] ?? '').trim()]))
  })
}

function parseAward(award: string): number {
  const n = award.match(/(\d+)\s*Star/)
  return n ? parseInt(n[1]) : 0  // Bib Gourmand / Selected → 0
}

function parseLocation(location: string): { city: string; country: string } {
  const parts = location.split(',').map(s => s.trim())
  if (parts.length >= 2) return { city: parts[0], country: parts[parts.length - 1] }
  return { city: parts[0] ?? '', country: '' }
}

function mapRow(r: Record<string, string>) {
  const { city, country } = parseLocation(r['Location'] ?? '')
  const lat = parseFloat(r['Latitude'])
  const lng = parseFloat(r['Longitude'])
  return {
    name:          r['Name'] || null,
    address:       r['Address'] || null,
    city,
    country,
    cuisine:       r['Cuisine'] || null,
    price_range:   r['Price'] || null,
    lat:           isNaN(lat) ? null : lat,
    lng:           isNaN(lng) ? null : lng,
    phone_number:  r['PhoneNumber'] || null,
    michelin_url:  r['Url'] || null,
    website_url:   r['WebsiteUrl'] || null,
    michelin_stars: parseAward(r['Award'] ?? ''),
    green_stars:   r['GreenStar'] === '1',
    facilities:    r['FacilitiesAndServices'] || null,
    description:   r['Description'] || null,
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function insertBatches<T extends object>(
  table: string,
  rows: T[],
  label: string
): Promise<{ id: string }[]> {
  const results: { id: string }[] = []

  // Test sur 1 ligne pour voir l'erreur clairement avant de batcher
  const { data: testData, error: testError } = await supabase
    .from(table)
    .insert([rows[0]])
    .select('id')

  if (testError) {
    console.error(`\n❌ Erreur d'insertion dans "${table}":`)
    console.error(`   Code:    ${testError.code}`)
    console.error(`   Message: ${testError.message}`)
    console.error(`   Détail:  ${testError.details ?? '—'}`)
    console.error(`   Hint:    ${testError.hint ?? '—'}`)
    console.error('\n💡 Si l\'erreur mentionne une colonne inconnue → la migration n\'a pas été appliquée.')
    console.error('   Lance le SQL affiché par "npm run migrate:csv" dans le dashboard Supabase.')
    return []
  }

  results.push(...(testData as { id: string }[]))

  for (let i = 1; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { data, error } = await supabase.from(table).insert(batch).select('id')
    if (error) {
      console.error(`\n❌ Erreur batch ${i}–${i + BATCH_SIZE}:`, error.message)
    } else {
      results.push(...(data as { id: string }[]))
    }
    process.stdout.write(`\r  ${label}: ${results.length}/${rows.length}   `)
  }
  console.log()
  return results
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n📦 Import CSV Michelin → Supabase\n')

  // 1. Trouve le CSV dans scripts/
  const csvFile = readdirSync(SCRIPTS_DIR).find(f => /\.(csv|tsv)$/i.test(f))
  if (!csvFile) {
    console.error('❌ Aucun fichier .csv ou .tsv trouvé dans scripts/')
    console.error('   Pose ton fichier là puis relance.')
    process.exit(1)
  }
  console.log(`📄 Fichier détecté: scripts/${csvFile}`)

  // 2. Parse
  const raw = readFileSync(join(SCRIPTS_DIR, csvFile), 'utf-8')
  const rows = parseCSV(raw).filter(r => r['Name'])
  console.log(`📊 ${rows.length} restaurants à importer\n`)

  // 3. Vide les données existantes (feed_posts en premier à cause des FK)
  console.log('🗑  Nettoyage des anciens restaurants…')
  await supabase.from('feed_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('restaurants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  console.log('  ✓ Table vidée\n')

  // 4. Insère les restaurants
  console.log('🍽  Insertion des restaurants…')
  const restaurants = rows.map(mapRow).filter(r => r.name)
  const inserted = await insertBatches('restaurants', restaurants, '✓ restaurants')
  console.log(`  → ${inserted.length} restaurants insérés\n`)

  if (inserted.length === 0) {
    console.error('❌ Aucun restaurant inséré. Vérifie que la migration a bien été exécutée.')
    process.exit(1)
  }

  // 5. Génère les feed posts (POSTS_PER_RESTAURANT par restaurant)
  console.log(`📹 Génération de ${POSTS_PER_RESTAURANT} feed posts par restaurant…`)
  const posts = inserted.flatMap((r, i) =>
    Array.from({ length: POSTS_PER_RESTAURANT }, (_, j) => ({
      restaurant_id: r.id,
      type: 'video' as const,
      content_url: VIDEO_URL,
      likes_count: Math.floor(Math.random() * 8000) + 10,
    }))
  )

  const insertedPosts = await insertBatches('feed_posts', posts, '✓ posts')
  console.log(`  → ${insertedPosts.length} feed posts générés\n`)

  // Résumé
  console.log('─'.repeat(50))
  console.log(`✅ Import terminé !`)
  console.log(`   🍽  ${inserted.length} restaurants`)
  console.log(`   📹  ${insertedPosts.length} feed posts (${POSTS_PER_RESTAURANT}/restaurant)`)
  console.log('─'.repeat(50) + '\n')
}

main().catch(err => {
  console.error('❌ Erreur fatale:', err)
  process.exit(1)
})
