import { supabaseAdmin } from './supabase'

// Scoring: 10 base per visit + 15 per Michelin star + 10 for green star + 20 per unique country beyond the first
export async function computeAndUpdateCircleScore(userId: string): Promise<number> {
  const { data: experiences } = await supabaseAdmin
    .from('experiences')
    .select('restaurant_id')
    .eq('user_id', userId)

  if (!experiences || experiences.length === 0) {
    await supabaseAdmin.from('users').update({ circle_score: 0 }).eq('id', userId)
    return 0
  }

  const restaurantIds = Array.from(new Set(experiences.map((e) => e.restaurant_id)))

  const { data: restaurants } = await supabaseAdmin
    .from('restaurants')
    .select('id, michelin_stars, green_stars, country')
    .in('id', restaurantIds)

  if (!restaurants) return 0

  const restaurantMap = new Map(restaurants.map((r) => [r.id, r]))
  const countries = new Set<string>()
  let score = 0

  for (const exp of experiences) {
    const r = restaurantMap.get(exp.restaurant_id)
    if (!r) continue
    score += 10
    score += r.michelin_stars * 15
    if (r.green_stars) score += 10
    countries.add(r.country)
  }

  score += Math.max(0, countries.size - 1) * 20

  await supabaseAdmin.from('users').update({ circle_score: score }).eq('id', userId)
  return score
}
