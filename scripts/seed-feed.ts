/**
 * Script de seed pour les feed posts
 * Crée 5 feed posts par restaurant avec les vidéos feed1.mov à feed5.mov
 * Usage: npx tsx scripts/seed-feed.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

// Charger les variables d'environnement
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

async function seedFeedPosts() {
  console.log('\n🌟 Début du seed Feed Posts\n')

  try {
    // Récupérer tous les restaurants
    const { data: restaurants, error: restaurantsError } = await supabase
      .from('restaurants')
      .select('id, name')

    if (restaurantsError) throw new Error(`restaurants: ${restaurantsError.message}`)

    console.log(`📍 ${restaurants.length} restaurants trouvés`)

    const FEED_BASE_URL = 'https://pplmaklememeytkghcgc.supabase.co/storage/v1/object/public/feed'
    const feedPosts = []

    // Pour chaque restaurant, créer 5 feed posts
    for (const restaurant of restaurants) {
      for (let i = 1; i <= 5; i++) {
        feedPosts.push({
          restaurant_id: restaurant.id,
          content_url: `${FEED_BASE_URL}/feed${i}.mov`,
          likes_count: Math.floor(Math.random() * 2000) + 50,
        })
      }
    }

    console.log(`\n📹 Insertion de ${feedPosts.length} feed posts (5 par restaurant)…`)

    // Insérer par chunks pour éviter les problèmes de limite
    const CHUNK_SIZE = 100
    for (let i = 0; i < feedPosts.length; i += CHUNK_SIZE) {
      const chunk = feedPosts.slice(i, i + CHUNK_SIZE)
      const { error } = await supabase.from('feed_posts').insert(chunk)
      if (error) throw new Error(`feed_posts chunk ${i}: ${error.message}`)
      console.log(`  ✓ ${Math.min(chunk.length, feedPosts.length - i)} posts`)
    }

    console.log(`\n✅ Seed Feed Posts terminé avec succès!`)
    console.log(`   ${feedPosts.length} feed posts créés`)
  } catch (error) {
    console.error('\n❌ Erreur lors du seed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

seedFeedPosts()
