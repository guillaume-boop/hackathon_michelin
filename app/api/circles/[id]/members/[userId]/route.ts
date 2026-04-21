import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, NotFoundError, UnauthorizedError, ServerError } from '@/lib/errors'

type Params = { params: { id: string; userId: string } }

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { data: circle } = await supabaseAdmin
    .from('circles')
    .select('owner_id')
    .eq('id', params.id)
    .single()

  if (!circle) return apiError(NotFoundError('Circle introuvable'))

  // Owner can remove anyone; members can remove themselves
  if (circle.owner_id !== me.id && me.id !== params.userId) {
    return apiError(UnauthorizedError('Action non autorisée'))
  }

  const { error } = await supabaseAdmin
    .from('circle_members')
    .delete()
    .eq('circle_id', params.id)
    .eq('user_id', params.userId)

  if (error) return apiError(ServerError(error.message))
  return new NextResponse(null, { status: 204 })
}
