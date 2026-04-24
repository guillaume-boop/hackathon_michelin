import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, NotFoundError, UnauthorizedError, BadRequestError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from('user_locations')
    .select('*')
    .eq('user_id', params.id)
    .single()

  if (error) return apiError(NotFoundError('Localisation introuvable'))
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())
  if (me.id !== params.id) return apiError(UnauthorizedError('Vous ne pouvez mettre à jour que votre propre position'))

  const body = await request.json()
  const { lat, lng } = body
  if (lat === undefined || lng === undefined) return apiError(BadRequestError('Champs requis: lat, lng'))

  const { data, error } = await supabaseAdmin
    .from('user_locations')
    .upsert({ user_id: params.id, lat, lng, updated_at: new Date().toISOString() })
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}
