import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, BadRequestError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function POST(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())
  if (me.id === params.id) return apiError(BadRequestError('Vous ne pouvez pas vous suivre vous-même'))

  const { error } = await supabaseAdmin
    .from('follows')
    .insert({ follower_id: me.id, followee_id: params.id })

  if (error) return apiError(ServerError(error.message))
  return new NextResponse(null, { status: 204 })
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { error } = await supabaseAdmin
    .from('follows')
    .delete()
    .eq('follower_id', me.id)
    .eq('followee_id', params.id)

  if (error) return apiError(ServerError(error.message))
  return new NextResponse(null, { status: 204 })
}
