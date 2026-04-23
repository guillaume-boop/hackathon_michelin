/**
 * Upload vidéo vers Supabase Storage
 * Usage: npx tsx scripts/upload-video.ts test1.mp4
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
import { readdirSync } from 'fs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Variables manquantes: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function uploadVideo() {
  const SCRIPTS_DIR = resolve(process.cwd(), 'scripts')
  const videoFile = readdirSync(SCRIPTS_DIR).find(f => /\.mp4$/i.test(f))

  if (!videoFile) {
    console.error('❌ Aucun fichier .mp4 trouvé dans scripts/')
    console.error('   Pose ton fichier vidéo (test1.mp4) dans scripts/')
    process.exit(1)
  }

  console.log(`📹 Upload de ${videoFile}...`)

  const filePath = resolve(SCRIPTS_DIR, videoFile)
  const fileBuffer = readFileSync(filePath)

  // Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from('feed')
    .upload(videoFile, fileBuffer, {
      contentType: 'video/mp4',
      upsert: true, // Remplace si existe
    })

  if (error) {
    console.error('❌ Erreur upload:', error.message)
    console.error('\n💡 As-tu créé le bucket "feed" dans Supabase?')
    console.error('   Dashboard → Storage → New Bucket → "feed" → Public')
    process.exit(1)
  }

  // Construct public URL
  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/feed/${data.path}`

  console.log('\n✅ Vidéo uploadée!')
  console.log(`\n🔗 URL publique:`)
  console.log(`   ${publicUrl}`)
  console.log(`\nUtilise cette URL dans import-csv.ts`)
}

uploadVideo().catch(err => {
  console.error('❌ Erreur:', err)
  process.exit(1)
})
