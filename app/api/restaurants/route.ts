import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { apiError, BadRequestError, ServerError } from '@/lib/errors'

export async function GET() {
  const { data, error } = await supabase.from('restaurants').select('*')

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    name,
    city,
    country,
    michelin_stars = 0,
    green_stars = false,
    dietary_option = null,
    lat = 0,
    lng = 0,
  } = body

  if (!name || !city || !country) {
    return apiError(BadRequestError('Champs requis: name, city, country'))
  }

  const { data, error } = await supabase
    .from('restaurants')
    .insert({ name, city, country, michelin_stars, green_stars, dietary_option, lat, lng })
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data, { status: 201 })
}
