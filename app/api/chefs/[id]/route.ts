import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, NotFoundError, UnauthorizedError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from('chef_profiles')
    .select('*, users(id, username, avatar_url), restaurants(id, name, city, country, michelin_stars, green_stars), chef_signature_dishes(*)')
    .or(`id.eq.${params.id},user_id.eq.${params.id}`)
    .single()

  if (error) return apiError(NotFoundError('Profil chef introuvable'))
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { data: chef } = await supabaseAdmin
    .from('chef_profiles')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (!chef) return apiError(NotFoundError('Profil chef introuvable'))
  if (chef.user_id !== me.id) return apiError(UnauthorizedError())

  const body = await request.json()
  const { bio, video_url, restaurant_id } = body

  const { data, error } = await supabaseAdmin
    .from('chef_profiles')
    .update({ bio, video_url, restaurant_id })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}
