import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, NotFoundError, UnauthorizedError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from('circles')
    .select('*, circle_members(user_id, role, users(id, username, avatar_url))')
    .eq('id', params.id)
    .single()

  if (error) return apiError(NotFoundError('Circle introuvable'))
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { data: circle } = await supabaseAdmin
    .from('circles')
    .select('owner_id')
    .eq('id', params.id)
    .single()

  if (!circle) return apiError(NotFoundError('Circle introuvable'))
  if (circle.owner_id !== me.id) return apiError(UnauthorizedError('Seul le propriétaire peut modifier ce circle'))

  const { name } = await request.json()
  const { data, error } = await supabaseAdmin
    .from('circles')
    .update({ name })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { data: circle } = await supabaseAdmin
    .from('circles')
    .select('owner_id')
    .eq('id', params.id)
    .single()

  if (!circle) return apiError(NotFoundError('Circle introuvable'))
  if (circle.owner_id !== me.id) return apiError(UnauthorizedError('Seul le propriétaire peut supprimer ce circle'))

  const { error } = await supabaseAdmin.from('circles').delete().eq('id', params.id)
  if (error) return apiError(ServerError(error.message))
  return new NextResponse(null, { status: 204 })
}
