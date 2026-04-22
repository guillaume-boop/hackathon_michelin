import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, ServerError } from '@/lib/errors'

// GET /api/feed?following=true&limit=20&offset=0
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const onlyFollowing = searchParams.get('following') === 'true'
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  const offset = parseInt(searchParams.get('offset') ?? '0', 10)

  let query = supabaseAdmin
    .from('feed_posts')
    .select('*, restaurants!feed_posts_restaurant_id_fkey(id, name, city, michelin_stars, green_stars, description)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (onlyFollowing) {
    const me = await getCurrentUser()
    if (me) {
      const { data: follows } = await supabaseAdmin
        .from('follows')
        .select('followee_id')
        .eq('follower_id', me.id)

      const ids = follows?.map((f) => f.followee_id) ?? []
      if (ids.length > 0) {
        query = query.in('user_id', ids)
      }
    }
  }

  const { data, error } = await query
  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}
