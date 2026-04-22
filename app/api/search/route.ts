import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')?.trim() ?? ''

  if (q.length < 1) return NextResponse.json({ restaurants: [], users: [] })

  const [{ data: restaurants }, { data: users }] = await Promise.all([
    supabaseAdmin
      .from('restaurants')
      .select('id, name, city, country, michelin_stars, green_stars')
      .or(`name.ilike.%${q}%,city.ilike.%${q}%`)
      .limit(20),
    supabaseAdmin
      .from('users')
      .select('id, username, avatar_url, role')
      .ilike('username', `%${q}%`)
      .limit(20),
  ])

  return NextResponse.json({ restaurants: restaurants ?? [], users: users ?? [] })
}
