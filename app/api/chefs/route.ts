import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, BadRequestError, ServerError } from '@/lib/errors'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('chef_profiles')
    .select('*, users(id, username, avatar_url), restaurants(id, name, city, michelin_stars)')

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const body = await request.json()
  const { restaurant_id, bio = null, video_url = null } = body

  if (!restaurant_id) return apiError(BadRequestError('Champ requis: restaurant_id'))

  const { data, error } = await supabaseAdmin
    .from('chef_profiles')
    .insert({ user_id: me.id, restaurant_id, bio, video_url })
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))

  // Promote user role to chef
  await supabaseAdmin.from('users').update({ role: 'chef' }).eq('id', me.id)

  return NextResponse.json(data, { status: 201 })
}
