/**
 * Script de peuplement de la base de données Michelin Social
 * Usage: npm run seed
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
import bcrypt from 'bcryptjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Variables manquantes: NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const VIDEO_URL = 'https://avtshare01.rz.tu-ilmenau.de/avt-vqdb-uhd-1/test_1/segments/bigbuck_bunny_8bit_7500kbps_1080p_60.0fps_h264.mp4'

const DEMO_VIDEOS = Array(10).fill(VIDEO_URL)

const RESTAURANTS = [
  { name: 'Alain Ducasse au Plaza Athénée', michelin_stars: 3, green_stars: false, city: 'Paris', country: 'France', lat: 48.866, lng: 2.301, description: 'Temple de la gastronomie française. Élégance, raffinement et créativité culinaire dans un cadre somptueux.', price_range: '$$$$', cuisine: ['French', 'Modern'], facilities: ['Terrasse', 'Cave à vins', 'Parking', 'Service traiteur'] },
  { name: 'Guy Savoy', michelin_stars: 3, green_stars: false, city: 'Paris', country: 'France', lat: 48.862, lng: 2.336, description: 'Maître incontesté de la haute cuisine parisienne. Un voyage sensoriel inoubliable à travers la France.', price_range: '$$$$', cuisine: ['French', 'Gastronomie'], facilities: ['Bar', 'Réservation requise', 'Parking', 'Climatisation'] },
  { name: 'Le Cinq — Four Seasons', michelin_stars: 3, green_stars: false, city: 'Paris', country: 'France', lat: 48.870, lng: 2.308, description: 'Trois étoiles de pure excellence. Cuisine de prestige servie dans un palace mythique.', price_range: '$$$$', cuisine: ['French', 'Luxury Dining'], facilities: ['Concierge', 'Service valet', 'Cave à vins', 'Terrasse'] },
  { name: 'L\'Arpège', michelin_stars: 3, green_stars: true, city: 'Paris', country: 'France', lat: 48.855, lng: 2.318, description: 'Alain Passard réinvente la cuisine avec les légumes du terroir. Nature et innovation au cœur.', price_range: '$$$$', cuisine: ['Vegetarian', 'Modern'], facilities: ['Cuisine ouverte', 'Menu dégustation', 'Parking accessible', 'Climatisation'] },
  { name: 'Mirazur', michelin_stars: 3, green_stars: true, city: 'Menton', country: 'France', lat: 43.776, lng: 7.501, description: 'Perché sur les Alpes Maritimes. Créativité débridée et respect de la nature en harmonie.', price_range: '$$$$', cuisine: ['Mediterranean', 'Modern'], facilities: ['Terrasse vue mer', 'Parking', 'Réservation requise', 'Bar'] },
  { name: 'Noma', michelin_stars: 2, green_stars: true, city: 'Copenhague', country: 'Danemark', lat: 55.683, lng: 12.598, description: 'Pionnière du Nordique. Saveurs brutes, ingrédients purs, philosophie responsable.', price_range: '$$$$', cuisine: ['Nordic', 'Seasonal'], facilities: ['Menu dégustation', 'Réservation requise', 'Cave à vins', 'Service conseil'] },
  { name: 'Le Bernardin', michelin_stars: 3, green_stars: false, city: 'New York', country: 'États-Unis', lat: 40.761, lng: -73.982, description: 'Nouvelle York. Poissons et fruits de mer sublimés. Excellence gastronomique made in USA.', price_range: '$$$$', cuisine: ['Seafood', 'French'], facilities: ['Bar à huître', 'Terrasse', 'Parking', 'Service privé'] },
  { name: 'Septime', michelin_stars: 1, green_stars: true, city: 'Paris', country: 'France', lat: 48.853, lng: 2.376, description: 'Jeune chef dans l\'air du temps. Produits de marché, cuisine vivante et authentique.', price_range: '$$', cuisine: ['Modern', 'Sharing'], facilities: ['Bar', 'Cuisine ouverte', 'Menu du marché', 'Ambiance décontractée'] },
  { name: 'La Grenouillère', michelin_stars: 2, green_stars: true, city: 'La Madelaine-sous-Montreuil', country: 'France', lat: 50.483, lng: 1.750, description: 'Hauts de France. Terre de traditions et d\'innovations culinaires subtiles.', price_range: '$$$', cuisine: ['Regional Cuisine', 'Modern'], facilities: ['Terrasse', 'Parking', 'Réservation requise', 'Vue campagne'] },
  { name: 'Le Chateaubriand', michelin_stars: 1, green_stars: false, city: 'Paris', country: 'France', lat: 48.864, lng: 2.377, description: 'Cuisine généreuse et de caractère. L\'essence de la bistronimie parisienne.', price_range: '$$', cuisine: ['Bistro', 'French'], facilities: ['Bar', 'Ambiance conviviale', 'Menu du jour', 'WiFi gratuit'] },
  { name: 'Flocons de Sel', michelin_stars: 3, green_stars: true, city: 'Megève', country: 'France', lat: 45.856, lng: 6.617, description: 'Montagne. Pureté des ingrédients, délicatesse des techniques, respect de la nature.', price_range: '$$$', cuisine: ['Alpine Cuisine', 'Modern'], facilities: ['Terrasse vue montagne', 'Parking', 'Spa', 'Cave à vins'] },
  { name: 'Hôtel de Ville — Rochat', michelin_stars: 3, green_stars: false, city: 'Crissier', country: 'Suisse', lat: 46.543, lng: 6.560, description: 'Suisse romande. Élégance helvète et créativité sans limites.', price_range: '$$$$', cuisine: ['French', 'Suisse'], facilities: ['Terrasse', 'Parking', 'Service traiteur', 'Réservation requise'] },
  { name: 'Narisawa', michelin_stars: 2, green_stars: true, city: 'Tokyo', country: 'Japon', lat: 35.671, lng: 139.732, description: 'Tokyo. Dialogues entre tradition japonaise et modernité culinaire.', price_range: '$$$', cuisine: ['Japanese', 'Modern'], facilities: ['Comptoir sushi', 'Menu dégustation', 'Parking', 'Réservation requise'] },
  { name: 'Restaurant de l\'Hôtel de Ville', michelin_stars: 2, green_stars: false, city: 'Lyon', country: 'France', lat: 45.756, lng: 4.835, description: 'Capitale gastronomique. Cuisine lyonnaise revisitée avec élégance.', price_range: '$$$', cuisine: ['Lyonnaise', 'Traditional'], facilities: ['Terrasse', 'Parking', 'Menu dégustation', 'Cave à vins'] },
  { name: 'Abysse', michelin_stars: 1, green_stars: false, city: 'Paris', country: 'France', lat: 48.878, lng: 2.309, description: 'Cuisine de saveurs. Produits de qualité, technique maîtrisée, âme généreuse.', price_range: '$$', cuisine: ['Modern', 'Contemporary'], facilities: ['Bar', 'Menu découverte', 'Ambiance chic', 'Service attentif'] },
]

const USERS = [
  { username: 'lucas_chefparis', email: 'lucas@demo.michelin', password: 'michelin2024', role: 'chef' as const },
  { username: 'emma_foodlover', email: 'emma@demo.michelin', password: 'michelin2024', role: 'user' as const },
  { username: 'pierre_gourmet', email: 'pierre@demo.michelin', password: 'michelin2024', role: 'user' as const },
  { username: 'sofia_tastes', email: 'sofia@demo.michelin', password: 'michelin2024', role: 'chef' as const },
  { username: 'maxime_explorer', email: 'maxime@demo.michelin', password: 'michelin2024', role: 'user' as const },
]

async function clearExistingData() {
  console.log('🗑  Nettoyage des données existantes…')
  await supabase.from('circle_memories').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('circle_members').delete().neq('circle_id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('circles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('feed_likes').delete().neq('post_id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('feed_posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('experiences').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('chef_signature_dishes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('chef_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('follows').delete().neq('follower_id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('user_locations').delete().neq('user_id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('restaurant_videos').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await supabase.from('users').delete().in('email', USERS.map(u => u.email))
  await supabase.from('restaurants').delete().in('name', RESTAURANTS.map(r => r.name))
}

async function seedRestaurants() {
  console.log('🍽  Insertion des restaurants…')
  const { data, error } = await supabase.from('restaurants').insert(RESTAURANTS).select()
  if (error) throw new Error(`restaurants: ${error.message}`)
  console.log(`  ✓ ${data.length} restaurants`)
  return data
}

async function seedUsers() {
  console.log('👤 Insertion des utilisateurs…')
  const usersToInsert = await Promise.all(
    USERS.map(async (u) => ({
      username: u.username,
      email: u.email,
      password_hash: await bcrypt.hash(u.password, 10),
      role: u.role,
      avatar_url: `https://picsum.photos/seed/${u.username}/200/200`,
      circle_score: Math.floor(Math.random() * 500),
    }))
  )
  const { data, error } = await supabase.from('users').insert(usersToInsert).select()
  if (error) throw new Error(`users: ${error.message}`)
  console.log(`  ✓ ${data.length} utilisateurs (mot de passe: michelin2024)`)
  return data
}

async function seedChefProfiles(users: { id: string; role: string; username: string }[], restaurants: { id: string; name: string }[]) {
  console.log('👨‍🍳 Insertion des profils chef…')
  const chefUsers = users.filter(u => u.role === 'chef')

  const profiles = chefUsers.map((user, i) => ({
    user_id: user.id,
    restaurant_id: restaurants[i].id,
    bio: [
      `Chef étoilé passionné par les produits du terroir français, je réinvente la gastronomie avec humilité et créativité. Chaque plat est une histoire.`,
      `Architecte des saveurs, je construis des expériences gustatives uniques en alliant tradition japonaise et techniques modernes.`,
    ][i] ?? `Chef passionné, amoureux des produits locaux et de la cuisine de saison.`,
    video_url: DEMO_VIDEOS[i] ?? null,
  }))

  const { data, error } = await supabase.from('chef_profiles').insert(profiles).select()
  if (error) throw new Error(`chef_profiles: ${error.message}`)

  // Signature dishes
  const dishes = data.flatMap((chef) => [
    { chef_profile_id: chef.id, name: 'Langoustine royale, caviar osciètre', description: 'Cuisson vapeur, émulsion d\'algues marines, huile de citron vert', photo_url: null, order: 1 },
    { chef_profile_id: chef.id, name: 'Pigeon rôti en croûte de foie gras', description: 'Jus corsé, écrasée de pomme de terre truffée', photo_url: null, order: 2 },
    { chef_profile_id: chef.id, name: 'Soufflé au Grand Marnier', description: 'Glace à la vanille de Madagascar', photo_url: null, order: 3 },
  ])

  await supabase.from('chef_signature_dishes').insert(dishes)
  console.log(`  ✓ ${data.length} profils chef avec plats signatures`)
  return data
}

async function seedFeedPosts(restaurants: { id: string; name: string }[]) {
  console.log('📹 Insertion des posts feed…')

  // Chaque restaurant peut avoir plusieurs vidéos
  const posts = restaurants.flatMap((restaurant, i) => [
    {
      restaurant_id: restaurant.id,
      type: 'video' as const,
      content_url: DEMO_VIDEOS[i % DEMO_VIDEOS.length],
      likes_count: Math.floor(Math.random() * 2000) + 50,
    },
    // Second post pour les 5 premiers restaurants
    ...(i < 5 ? [{
      restaurant_id: restaurant.id,
      type: 'video' as const,
      content_url: DEMO_VIDEOS[(i + 5) % DEMO_VIDEOS.length],
      likes_count: Math.floor(Math.random() * 1000) + 20,
    }] : []),
  ])

  const { data, error } = await supabase.from('feed_posts').insert(posts).select()
  if (error) throw new Error(`feed_posts: ${error.message}`)
  console.log(`  ✓ ${data.length} posts feed`)
  return data
}

async function seedExperiences(users: { id: string }[], restaurants: { id: string; name: string; michelin_stars: number }[]) {
  console.log('⭐ Insertion des expériences…')

  const experiences = users.flatMap(user =>
    restaurants.slice(0, 5).map((restaurant, i) => ({
      user_id: user.id,
      restaurant_id: restaurant.id,
      rating: Math.min(5, Math.max(3, restaurant.michelin_stars + 2)),
      note: [
        'Une expérience gastronomique inoubliable, chaque plat était une œuvre d\'art.',
        'Service impeccable, ambiance feutrée et cuisine d\'exception.',
        'Le chef nous a emmené dans un voyage sensoriel extraordinaire.',
        null,
        'La meilleure soirée de l\'année. On y retourne sans hésitation.',
      ][i] ?? null,
      visited_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    }))
  )

  const { data, error } = await supabase.from('experiences').insert(experiences).select()
  if (error) throw new Error(`experiences: ${error.message}`)
  console.log(`  ✓ ${data.length} expériences`)
  return data
}

async function seedCircles(users: { id: string; username: string }[]) {
  console.log('◎  Insertion des circles…')

  const circlesData = [
    { name: 'Les Amis Gourmets', owner_id: users[0].id },
    { name: 'Paris Fine Dining Club', owner_id: users[1].id },
    { name: 'Trio Étoilé', owner_id: users[2].id },
  ]

  const { data: circles, error } = await supabase.from('circles').insert(circlesData).select()
  if (error) throw new Error(`circles: ${error.message}`)

  const members = circles.flatMap(circle => [
    { circle_id: circle.id, user_id: circle.owner_id, role: 'owner' as const },
    ...users.slice(0, 3)
      .filter(u => u.id !== circle.owner_id)
      .map(u => ({ circle_id: circle.id, user_id: u.id, role: 'member' as const })),
  ])

  await supabase.from('circle_members').insert(members)
  console.log(`  ✓ ${circles.length} circles`)
}

async function seedFollows(users: { id: string }[]) {
  console.log('🔗 Insertion des follows…')
  const follows = []
  for (let i = 0; i < users.length; i++) {
    for (let j = 0; j < users.length; j++) {
      if (i !== j && Math.random() > 0.5) {
        follows.push({ follower_id: users[i].id, followee_id: users[j].id })
      }
    }
  }
  if (follows.length > 0) {
    await supabase.from('follows').insert(follows)
  }
  console.log(`  ✓ ${follows.length} relations de suivi`)
}

async function seedLocations(users: { id: string }[]) {
  console.log('📍 Insertion des localisations…')
  const locations = users.map((user, i) => ({
    user_id: user.id,
    lat: [48.86, 48.85, 43.78, 55.68, 40.76][i] ?? 48.86,
    lng: [2.33, 2.37, 7.50, 12.59, -73.98][i] ?? 2.33,
  }))
  await supabase.from('user_locations').insert(locations)
  console.log(`  ✓ ${locations.length} localisations`)
}

async function seedRestaurantVideos(restaurants: { id: string; name: string }[]) {
  console.log('🎬 Insertion des vidéos restaurants…')
  const FEED_BASE_URL = 'https://pplmaklememeytkghcgc.supabase.co/storage/v1/object/public/feed'
  const videos = restaurants.flatMap((restaurant) =>
    Array.from({ length: 5 }).map((_, i) => ({
      restaurant_id: restaurant.id,
      url: `${FEED_BASE_URL}/feed${i + 1}.mov`,
      order: i + 1,
    }))
  )
  await supabase.from('restaurant_videos').insert(videos)
  console.log(`  ✓ ${videos.length} vidéos restaurant (${videos.length / restaurants.length} par restaurant)`)
}

async function main() {
  console.log('\n🌟 Début du seed Michelin Social\n')

  try {
    await clearExistingData()

    const restaurants = await seedRestaurants()
    const users = await seedUsers()
    await seedChefProfiles(users, restaurants)
    await seedFeedPosts(restaurants)
    await seedExperiences(users, restaurants)
    await seedCircles(users)
    await seedFollows(users)
    await seedLocations(users)
    await seedRestaurantVideos(restaurants)

    console.log('\n✅ Seed terminé avec succès !\n')
    console.log('Comptes de test:')
    USERS.forEach(u => {
      console.log(`  ${u.email} / michelin2024`)
    })
    console.log('\nLancez: npm run dev')
  } catch (err) {
    console.error('\n❌ Erreur lors du seed:', err)
    process.exit(1)
  }
}

main()
