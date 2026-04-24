import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, BadRequestError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from('circle_memories')
    .select('*, experiences(*, restaurants(id, name, city, michelin_stars), users(id, username, avatar_url))')
    .eq('circle_id', params.id)
    .order('added_at', { ascending: false })

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  // Must be a member of the circle
  const { data: membership } = await supabaseAdmin
    .from('circle_members')
    .select('role')
    .eq('circle_id', params.id)
    .eq('user_id', me.id)
    .single()

  if (!membership) return apiError(UnauthorizedError('Vous n\'êtes pas membre de ce circle'))

  const { experience_id } = await request.json()
  if (!experience_id) return apiError(BadRequestError('Champ requis: experience_id'))

  const { data, error } = await supabaseAdmin
    .from('circle_memories')
    .insert({ circle_id: params.id, experience_id })
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data, { status: 201 })
}
