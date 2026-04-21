import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, NotFoundError, UnauthorizedError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id, username, avatar_url, role, circle_score, created_at')
    .eq('id', params.id)
    .single()

  if (error) return apiError(NotFoundError('Utilisateur introuvable'))
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())
  if (me.id !== params.id) return apiError(UnauthorizedError('Vous ne pouvez modifier que votre propre profil'))

  const body = await request.json()
  const { username, avatar_url } = body

  const { data, error } = await supabaseAdmin
    .from('users')
    .update({ username, avatar_url })
    .eq('id', params.id)
    .select('id, username, avatar_url, role, circle_score, created_at')
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}
