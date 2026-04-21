import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { computeAndUpdateCircleScore } from '@/lib/circle-score'
import { apiError, NotFoundError, UnauthorizedError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from('experiences')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return apiError(NotFoundError('Expérience introuvable'))
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { data: existing } = await supabaseAdmin
    .from('experiences')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (!existing) return apiError(NotFoundError('Expérience introuvable'))
  if (existing.user_id !== me.id) return apiError(UnauthorizedError())

  const body = await request.json()
  const { rating, note, media_urls, visited_at } = body

  const { data, error } = await supabaseAdmin
    .from('experiences')
    .update({ rating, note, media_urls, visited_at })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { data: existing } = await supabaseAdmin
    .from('experiences')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (!existing) return apiError(NotFoundError('Expérience introuvable'))
  if (existing.user_id !== me.id) return apiError(UnauthorizedError())

  const { error } = await supabaseAdmin.from('experiences').delete().eq('id', params.id)
  if (error) return apiError(ServerError(error.message))

  await computeAndUpdateCircleScore(me.id)
  return new NextResponse(null, { status: 204 })
}
