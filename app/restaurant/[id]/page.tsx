import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import RestaurantPageClient from './RestaurantPageClient'

export default async function RestaurantPage({ params }: { params: { id: string } }) {
  const [{ data: restaurant }, { data: chefs }, { data: posts }, { data: dishes }] = await Promise.all([
    supabaseAdmin.from('restaurants').select('*').eq('id', params.id).single(),
    supabaseAdmin
      .from('chef_profiles')
      .select('id, bio, user_id, users(id, username, avatar_url)')
      .eq('restaurant_id', params.id),
    supabaseAdmin
      .from('feed_posts')
      .select('id, content_url, likes_count')
      .eq('restaurant_id', params.id)
      .order('likes_count', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('chef_signature_dishes')
      .select('id, name, description, photo_url, order, chef_profile_id')
      .order('order'),
  ])

  if (!restaurant) notFound()

  // Supabase returns users as array on joins — normalize to single object
  const normalizedChefs = (chefs ?? []).map((c) => ({
    id: c.id,
    bio: c.bio,
    users: Array.isArray(c.users) ? c.users[0] ?? null : c.users,
  }))

  const chefIds = new Set(normalizedChefs.map((c) => c.id))
  const menuDishes = (dishes ?? []).filter((d) => chefIds.has(d.chef_profile_id))

  return (
    <RestaurantPageClient
      restaurant={restaurant}
      chefs={normalizedChefs}
      posts={posts ?? []}
      menuDishes={menuDishes}
    />
  )
}
