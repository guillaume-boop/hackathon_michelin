/**
 * Script de seeding final: 10k restaurants + 20 users + relations vivantes
 * Usage: npm run seed-final
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import * as readline from 'readline'
import { createReadStream } from 'fs'

// Load .env.local
try {
  const content = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch { /* .env.local absent */ }

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const STORAGE_BASE = 'https://pplmaklememeytkghcgc.supabase.co/storage/v1/object/public'

// Assets
const CHEF_IMAGES = Array.from({ length: 9 }, (_, i) => `${STORAGE_BASE}/chefs/img_chef_${i + 1}.png`)
const PLAT_IMAGES = Array.from({ length: 11 }, (_, i) => `${STORAGE_BASE}/plats/img_plat_${i + 1}.png`)
const RESTAURANT_IMAGES = Array.from({ length: 14 }, (_, i) => `${STORAGE_BASE}/restaurants/img_resto_${i + 1}.png`)
const CHEF_VIDEOS = Array.from({ length: 5 }, (_, i) => `${STORAGE_BASE}/chef_videos/chef_${i + 1}.mp4`)
const FEED_VIDEOS = Array.from({ length: 5 }, (_, i) => `${STORAGE_BASE}/feed/feed${i + 1}.mov`)

const SAMPLE_DESCRIPTIONS = [
  'Cuisine raffinée avec des produits locaux sélectionnés avec soin.',
  'Un véritable voyage culinaire où chaque plat raconte une histoire.',
  'Excellence gastronomique dans une ambiance chaleureuse.',
  'Innovation et tradition se rencontrent dans chaque assiette.',
  'Saveurs intenses et présentations élégantes.',
  'Cuisine moderne inspirée par les classiques.',
  'Talents culinaires exceptionnels au service de votre plaisir.',
]

const USERNAMES = [
  'alice_gourmet', 'bob_foodie', 'charlie_taste', 'diana_fork', 'emma_spoon',
  'frank_plate', 'grace_cook', 'henry_chef', 'iris_meal', 'jack_dine',
  'kate_eats', 'leo_sauce', 'mona_bite', 'noah_taste', 'olivia_feast',
  'peter_fork', 'quinn_plate', 'rachel_cook', 'sam_chef', 'tina_meal',
]

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function parseCSVLine(line: string): Record<string, string> {
  const fields: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current)
      current = ''
    } else {
      current += char
    }
  }
  fields.push(current)

  return {
    name: fields[0]?.trim(),
    address: fields[1]?.trim(),
    location: fields[2]?.trim(),
    price: fields[3]?.trim(),
    cuisine: fields[4]?.trim(),
    longitude: fields[5]?.trim(),
    latitude: fields[6]?.trim(),
    phone: fields[7]?.trim(),
    url: fields[8]?.trim(),
    website: fields[9]?.trim(),
    award: fields[10]?.trim(),
    green_star: fields[11]?.trim(),
    facilities: fields[12]?.trim(),
    description: fields[13]?.trim(),
  }
}

function extractMichelinStars(award: string): number {
  const match = award?.match(/(\d+)\s*Star/)
  return parseInt(match?.[1] ?? '0')
}

async function readCSV(filePath: string, limit: number): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = []
    const rl = readline.createInterface({
      input: createReadStream(filePath),
      crlfDelay: Infinity,
    })

    let lineCount = 0
    rl.on('line', (line) => {
      if (lineCount === 0) {
        lineCount++
        return // skip header
      }
      if (lineCount > limit) {
        rl.close()
        return
      }

      try {
        const parsed = parseCSVLine(line)
        results.push(parsed)
        lineCount++
      } catch (err) {
        console.warn(`Skipping line ${lineCount}: ${err}`)
      }
    })

    rl.on('close', () => resolve(results))
    rl.on('error', reject)
  })
}

async function clearTables() {
  console.log('🗑  Clearing tables...')

  const tables = [
    'circle_memories', 'circle_members', 'circles',
    'feed_bookmarks', 'feed_likes', 'feed_posts',
    'experience_bookmarks', 'experience_likes', 'experiences',
    'chef_signature_dishes', 'chef_profiles',
    'follows', 'user_locations',
    'restaurant_videos',
    'restaurants', 'users',
  ]

  for (const table of tables) {
    await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  }

  console.log('  ✓ Tables cleared')
}

async function seedUsers(count: number = 20) {
  console.log(`👤 Creating ${count} regular users...`)

  const users = await Promise.all(
    USERNAMES.slice(0, count).map(async (username) => ({
      username,
      email: `${username}@michelin.app`,
      password_hash: await bcrypt.hash('password123', 10),
      role: 'user',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      circle_score: Math.floor(Math.random() * 1000),
    }))
  )

  const { data, error } = await supabase.from('users').insert(users).select()
  if (error) throw new Error(`users: ${error.message}`)
  console.log(`  ✓ ${data.length} users created`)
  return data
}

async function seedChefUsers(count: number = 10000) {
  console.log(`👨‍🍳 Creating ${count} chef users...`)

  const chefs = await Promise.all(
    Array.from({ length: count }, async (_, i) => ({
      username: `chef_${i + 1}`,
      email: `chef.${i + 1}@michelin.app`,
      password_hash: await bcrypt.hash('password123', 10),
      role: 'chef',
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=chef_${i + 1}`,
      circle_score: Math.floor(Math.random() * 1000),
    }))
  )

  const batchSize = 500
  const allData = []

  for (let i = 0; i < chefs.length; i += batchSize) {
    const batch = chefs.slice(i, i + batchSize)
    const { data, error } = await supabase.from('users').insert(batch).select()
    if (error) throw new Error(`chef users batch: ${error.message}`)
    allData.push(...data)
    console.log(`  ✓ Chef batch ${Math.floor(i / batchSize) + 1} (${allData.length}/${count})`)
  }

  return allData
}

async function seedRestaurants(csvRestaurants: any[]) {
  console.log(`🍽  Creating ${csvRestaurants.length} restaurants...`)

  const restaurants = csvRestaurants.map((csv) => ({
    name: csv.name,
    address: csv.address,
    city: csv.location?.split(',')[0]?.trim() || 'Unknown',
    country: csv.location?.split(',')[1]?.trim() || 'Unknown',
    michelin_stars: extractMichelinStars(csv.award),
    green_stars: csv.green_star === '1',
    cuisine: csv.cuisine,
    price_range: csv.price,
    phone_number: csv.phone,
    michelin_url: csv.url,
    website_url: csv.website,
    facilities: csv.facilities,
    description: csv.description || randomElement(SAMPLE_DESCRIPTIONS),
    lat: parseFloat(csv.latitude) || 0,
    lng: parseFloat(csv.longitude) || 0,
  }))

  const batchSize = 500
  const allData = []

  for (let i = 0; i < restaurants.length; i += batchSize) {
    const batch = restaurants.slice(i, i + batchSize)
    const { data, error } = await supabase.from('restaurants').insert(batch).select()
    if (error) throw new Error(`restaurants batch ${i}: ${error.message}`)
    allData.push(...data)
    console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1} (${allData.length}/${restaurants.length})`)
  }

  return allData
}

async function seedChefs(chefUsers: any[], restaurants: any[]) {
  console.log('👨‍🍳 Creating chef profiles (1 per restaurant)...')

  if (chefUsers.length === 0 || restaurants.length === 0) {
    console.log('  ⚠  Not enough users or restaurants')
    return []
  }

  const profiles = restaurants.map((restaurant, idx) => ({
    user_id: chefUsers[idx % chefUsers.length].id,
    restaurant_id: restaurant.id,
    bio: `Passionate chef dedicated to exceptional cuisine and unforgettable dining experiences.`,
    video_url: randomElement(CHEF_VIDEOS),
  }))

  if (profiles.length === 0) {
    console.log('  ⚠  No profiles to create')
    return []
  }

  const { data, error } = await supabase.from('chef_profiles').insert(profiles).select()
  if (error) throw new Error(`chef_profiles: ${error.message}`)

  // Add signature dishes
  const dishes = data.flatMap((chef) =>
    Array.from({ length: 3 }, (_, i) => ({
      chef_profile_id: chef.id,
      name: `Signature Dish ${i + 1}`,
      description: 'A masterpiece of culinary art',
      photo_url: randomElement(PLAT_IMAGES),
      order: i + 1,
    }))
  )

  if (dishes.length > 0) {
    await supabase.from('chef_signature_dishes').insert(dishes)
  }

  console.log(`  ✓ ${data.length} chef profiles with signature dishes`)
  return data
}

async function seedFeedPosts(restaurants: any[]) {
  console.log('📹 Creating feed posts...')

  const posts = restaurants.flatMap((restaurant) =>
    Array.from({ length: 3 }, (_, i) => ({
      restaurant_id: restaurant.id,
      type: 'video',
      content_url: randomElement(FEED_VIDEOS),
      likes_count: Math.floor(Math.random() * 5000) + 100,
    }))
  )

  const batchSize = 1000
  let totalCreated = 0

  for (let i = 0; i < posts.length; i += batchSize) {
    const batch = posts.slice(i, i + batchSize)
    const { data, error } = await supabase.from('feed_posts').insert(batch).select()
    if (error) throw new Error(`feed_posts batch: ${error.message}`)
    totalCreated += data.length
    console.log(`  ✓ Batch ${Math.floor(i / batchSize) + 1} (${totalCreated}/${posts.length})`)
  }

  return totalCreated
}

async function seedExperiences(users: any[], restaurants: any[]) {
  console.log('⭐ Creating experiences...')

  const experiences = users.flatMap((user) => {
    const userExperiences = Math.floor(Math.random() * 15) + 5
    const selectedRestaurants = restaurants
      .sort(() => Math.random() - 0.5)
      .slice(0, userExperiences)

    return selectedRestaurants.map((restaurant) => ({
      user_id: user.id,
      restaurant_id: restaurant.id,
      rating: Math.min(5, Math.max(1, Math.floor(restaurant.michelin_stars + Math.random() * 2))),
      note: Math.random() > 0.4
        ? [
            'Absolutely unforgettable experience!',
            'Remarkable culinary journey.',
            'Exceptional service and food.',
            'Worth every penny.',
            'A true gastronomic adventure.',
            'One of the best meals of my life.',
            'Highly recommend to all food lovers.',
          ][Math.floor(Math.random() * 7)]
        : null,
      visited_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }))
  })

  const batchSize = 1000
  let totalCreated = 0

  for (let i = 0; i < experiences.length; i += batchSize) {
    const batch = experiences.slice(i, i + batchSize)
    const { data, error } = await supabase.from('experiences').insert(batch).select()
    if (error) throw new Error(`experiences batch: ${error.message}`)
    totalCreated += data.length
  }

  console.log(`  ✓ ${totalCreated} experiences`)
}

async function seedFollows(users: any[]) {
  console.log('🔗 Creating follows...')

  const follows = []
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j && Math.random() > 0.6) {
        follows.push({ follower_id: users[i].id, followee_id: users[j].id })
      }
    }
  }

  if (follows.length > 0) {
    const { error } = await supabase.from('follows').insert(follows)
    if (error) throw new Error(`follows: ${error.message}`)
  }

  console.log(`  ✓ ${follows.length} follow relationships`)
}

async function seedLocations(users: any[], restaurants: any[]) {
  console.log('📍 Creating user locations...')

  const locations = users.map((user) => {
    const restaurant = randomElement(restaurants)
    return {
      user_id: user.id,
      lat: restaurant.lat + (Math.random() - 0.5) * 2,
      lng: restaurant.lng + (Math.random() - 0.5) * 2,
    }
  })

  const { error } = await supabase.from('user_locations').insert(locations)
  if (error) throw new Error(`user_locations: ${error.message}`)

  console.log(`  ✓ ${locations.length} user locations`)
}

async function seedLikesAndBookmarks(users: any[], feedPosts: number, experiences: any[]) {
  console.log('❤️  Creating likes and bookmarks...')

  const { data: allPosts } = await supabase.from('feed_posts').select('id').limit(feedPosts)

  if (!allPosts) {
    console.log('  ⚠  No posts found')
    return
  }

  // Feed likes
  const feedLikes = []
  for (const post of allPosts.slice(0, Math.min(1000, feedPosts))) {
    const likeCount = Math.floor(Math.random() * 10)
    for (let i = 0; i < likeCount; i++) {
      feedLikes.push({
        post_id: post.id,
        user_id: randomElement(users).id,
      })
    }
  }

  if (feedLikes.length > 0) {
    const batchSize = 500
    for (let i = 0; i < feedLikes.length; i += batchSize) {
      const batch = feedLikes.slice(i, i + batchSize)
      await supabase.from('feed_likes').insert(batch)
    }
  }

  // Experience bookmarks
  const bookmarks = users.flatMap((user) => {
    const bookmarkCount = Math.floor(Math.random() * 5)
    return experiences
      .sort(() => Math.random() - 0.5)
      .slice(0, bookmarkCount)
      .map((exp) => ({
        experience_id: exp.id,
        user_id: user.id,
      }))
  })

  if (bookmarks.length > 0) {
    const batchSize = 500
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      const batch = bookmarks.slice(i, i + batchSize)
      await supabase.from('experience_bookmarks').insert(batch)
    }
  }

  console.log(`  ✓ ${feedLikes.length} feed likes + ${bookmarks.length} bookmarks`)
}

async function seedCircles(users: any[]) {
  console.log('◎  Creating circles...')

  const circleNames = [
    'Michelin Enthusiasts',
    'Fine Dining Club',
    'Foodie Collective',
    'Gourmet Society',
    'Culinary Explorers',
  ]

  const circles = await Promise.all(
    circleNames.map(async (name) => {
      const owner = randomElement(users)
      const { data, error } = await supabase
        .from('circles')
        .insert({ name, owner_id: owner.id })
        .select()
      if (error) throw error
      const circle = data?.[0]
      if (!circle) throw new Error('Failed to create circle')

      const members = users
        .filter(u => u.id !== owner.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * users.length / 2) + 1)

      const memberData = [
        { circle_id: circle.id, user_id: owner.id, role: 'owner' },
        ...members.map((u) => ({ circle_id: circle.id, user_id: u.id, role: 'member' })),
      ]

      await supabase.from('circle_members').insert(memberData)
      return circle
    })
  )

  console.log(`  ✓ ${circles.length} circles`)
}

async function main() {
  console.log('\n🌟 Starting Final Seed Script\n')

  try {
    await clearTables()

    const users = await seedUsers(20)

    // Read CSV
    const csvPath = resolve(process.cwd(), 'scripts/michelin_my_maps - michelin_my_maps.csv')
    console.log(`📂 Reading CSV from ${csvPath}...`)
    const csvRestaurants = await readCSV(csvPath, 10000)
    console.log(`  ✓ Loaded ${csvRestaurants.length} restaurants from CSV`)

    const restaurants = await seedRestaurants(csvRestaurants)

    const chefUsers = await seedChefUsers(restaurants.length)

    await seedChefs(chefUsers, restaurants)
    const feedPostsCount = await seedFeedPosts(restaurants)

    const { data: allExperiences } = await supabase.from('experiences').select('id')
    await seedExperiences(users, restaurants)

    await seedFollows(users)
    await seedLocations(users, restaurants)

    const { data: updatedExperiences } = await supabase.from('experiences').select('id')
    await seedLikesAndBookmarks(users, feedPostsCount, updatedExperiences || [])

    await seedCircles(users)

    console.log('\n✅ Seed completed successfully!\n')
    console.log('Test accounts:')
    USERNAMES.slice(0, 5).forEach(u => {
      console.log(`  ${u}@michelin.app / password123`)
    })
    console.log('\nRun: npm run dev')
  } catch (err) {
    console.error('\n❌ Seed error:', err)
    process.exit(1)
  }
}

main()
