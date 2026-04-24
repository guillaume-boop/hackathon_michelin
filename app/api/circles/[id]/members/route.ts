import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, NotFoundError, UnauthorizedError, BadRequestError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from('circle_members')
    .select('role, users(id, username, avatar_url)')
    .eq('circle_id', params.id)

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { data: circle } = await supabaseAdmin
    .from('circles')
    .select('owner_id')
    .eq('id', params.id)
    .single()

  if (!circle) return apiError(NotFoundError('Circle introuvable'))
  if (circle.owner_id !== me.id) return apiError(UnauthorizedError('Seul le propriétaire peut ajouter des membres'))

  const { user_id } = await request.json()
  if (!user_id) return apiError(BadRequestError('Champ requis: user_id'))

  const { data, error } = await supabaseAdmin
    .from('circle_members')
    .insert({ circle_id: params.id, user_id, role: 'member' })
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data, { status: 201 })
}
