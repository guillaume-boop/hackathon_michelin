import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { computeAndUpdateCircleScore } from '@/lib/circle-score'
import { apiError, UnauthorizedError, BadRequestError, ServerError } from '@/lib/errors'

// GET /api/experiences?user_id=&restaurant_id=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('user_id')
  const restaurantId = searchParams.get('restaurant_id')

  let query = supabaseAdmin.from('experiences').select('*, restaurants(id, name, city, michelin_stars)').order('visited_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)
  if (restaurantId) query = query.eq('restaurant_id', restaurantId)

  const { data, error } = await query
  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const body = await request.json()
  const { restaurant_id, rating, note = null, media_urls = [], visited_at } = body

  if (!restaurant_id || !rating) return apiError(BadRequestError('Champs requis: restaurant_id, rating'))

  const { data, error } = await supabaseAdmin
    .from('experiences')
    .insert({ user_id: me.id, restaurant_id, rating, note, media_urls, visited_at: visited_at ?? new Date().toISOString() })
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))

  await computeAndUpdateCircleScore(me.id)

  return NextResponse.json(data, { status: 201 })
}
