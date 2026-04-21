import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, ServerError } from '@/lib/errors'

type Params = { params: { id: string; videoId: string } }

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { error } = await supabaseAdmin
    .from('restaurant_videos')
    .delete()
    .eq('id', params.videoId)
    .eq('restaurant_id', params.id)

  if (error) return apiError(ServerError(error.message))
  return new NextResponse(null, { status: 204 })
}
