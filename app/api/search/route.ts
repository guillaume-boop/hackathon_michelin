import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''
  const ville = searchParams.get('ville')?.trim() ?? ''
  const michelin_stars = searchParams.get('michelin_stars')
  const budget = searchParams.get('budget')
  const cuisine = searchParams.get('cuisine')?.trim() ?? ''

  let restaurantQuery = supabaseAdmin
    .from('restaurants')
    .select('id, name, city, country, michelin_stars, green_stars, price_range, cuisine, facilities, address, phone_number, michelin_url, website_url')

  // Text search - search by name OR city
  if (q.length > 0) {
    restaurantQuery = restaurantQuery.or(`name.ilike.%${q}%,city.ilike.%${q}%`)
  }

  // Filter by city
  if (ville) {
    restaurantQuery = restaurantQuery.ilike('city', `%${ville}%`)
  }

  // Filter by michelin stars
  if (michelin_stars !== null && michelin_stars !== '') {
    restaurantQuery = restaurantQuery.eq('michelin_stars', Number(michelin_stars))
  }

  // Filter by budget (based on price_range value)
  if (budget !== null && budget !== '') {
    const budgetNum = Number(budget)
    const budgetSymbol = '€'.repeat(budgetNum)
    restaurantQuery = restaurantQuery.eq('price_range', budgetSymbol)
  }

  // Filter by cuisine (text contains)
  if (cuisine) {
    restaurantQuery = restaurantQuery.ilike('cuisine', `%${cuisine}%`)
  }

  const [{ data: restaurants }, { data: users }] = await Promise.all([
    restaurantQuery.limit(50),
    q.length > 0
      ? supabaseAdmin
          .from('users')
          .select('id, username, avatar_url, role')
          .ilike('username', `%${q}%`)
          .limit(20)
      : Promise.resolve({ data: [] } as { data: Array<{ id: string; username: string; avatar_url: string | null; role: string }> }),
  ])

  return NextResponse.json({ restaurants: restaurants ?? [], users: users ?? [] })
}
