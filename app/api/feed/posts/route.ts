import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, BadRequestError, ServerError } from '@/lib/errors'

export async function POST(request: Request) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const body = await request.json()
  const { restaurant_id, type, content_url = null } = body

  if (!restaurant_id || !type) return apiError(BadRequestError('Champs requis: restaurant_id, type'))

  const { data, error } = await supabaseAdmin
    .from('feed_posts')
    .insert({ user_id: me.id, restaurant_id, type, content_url })
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data, { status: 201 })
}
