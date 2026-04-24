import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, ServerError } from '@/lib/errors'

type Params = { params: { id: string; memoryId: string } }

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  // Must be a member
  const { data: membership } = await supabaseAdmin
    .from('circle_members')
    .select('role')
    .eq('circle_id', params.id)
    .eq('user_id', me.id)
    .single()

  if (!membership) return apiError(UnauthorizedError('Vous n\'êtes pas membre de ce circle'))

  const { error } = await supabaseAdmin
    .from('circle_memories')
    .delete()
    .eq('id', params.memoryId)
    .eq('circle_id', params.id)

  if (error) return apiError(ServerError(error.message))
  return new NextResponse(null, { status: 204 })
}
