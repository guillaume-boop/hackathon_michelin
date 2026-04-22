import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return NextResponse.json({ saved: false })

  const { data } = await supabaseAdmin
    .from('experience_bookmarks')
    .select('user_id')
    .eq('experience_id', params.id)
    .eq('user_id', me.id)
    .maybeSingle()

  return NextResponse.json({ saved: !!data })
}

export async function POST(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { error } = await supabaseAdmin
    .from('experience_bookmarks')
    .insert({ experience_id: params.id, user_id: me.id })

  if (error && error.code !== '23505') return apiError(ServerError(error.message))
  return new NextResponse(null, { status: 204 })
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  await supabaseAdmin
    .from('experience_bookmarks')
    .delete()
    .eq('experience_id', params.id)
    .eq('user_id', me.id)

  return new NextResponse(null, { status: 204 })
}
