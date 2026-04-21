import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, ServerError } from '@/lib/errors'

// GET /api/map/friends — returns real-time locations of followed users
export async function GET() {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { data: follows } = await supabaseAdmin
    .from('follows')
    .select('followee_id')
    .eq('follower_id', me.id)

  const ids = follows?.map((f) => f.followee_id) ?? []
  if (ids.length === 0) return NextResponse.json([])

  const { data, error } = await supabaseAdmin
    .from('user_locations')
    .select('user_id, lat, lng, updated_at, users(id, username, avatar_url)')
    .in('user_id', ids)

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}
