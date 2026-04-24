import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, BadRequestError, ServerError } from '@/lib/errors'

// GET /api/circles — returns circles where the current user is owner or member
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { data, error } = await supabaseAdmin
    .from('circle_members')
    .select('role, circles(id, name, owner_id, created_at)')
    .eq('user_id', me.id)

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const body = await request.json()
  const { name } = body
  if (!name) return apiError(BadRequestError('Champ requis: name'))

  const { data: circle, error: circleError } = await supabaseAdmin
    .from('circles')
    .insert({ name, owner_id: me.id })
    .select()
    .single()

  if (circleError) return apiError(ServerError(circleError.message))

  // Auto-add owner as member
  await supabaseAdmin
    .from('circle_members')
    .insert({ circle_id: circle.id, user_id: me.id, role: 'owner' })

  return NextResponse.json(circle, { status: 201 })
}
