import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, BadRequestError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from('restaurant_videos')
    .select('*')
    .eq('restaurant_id', params.id)
    .order('order', { ascending: true })

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const body = await request.json()
  const { url, title = null, order = 0 } = body
  if (!url) return apiError(BadRequestError('Champ requis: url'))

  const { data, error } = await supabaseAdmin
    .from('restaurant_videos')
    .insert({ restaurant_id: params.id, url, title, order })
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data, { status: 201 })
}
