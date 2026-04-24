import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, ServerError } from '@/lib/errors'

// GET /api/feed?following=true&limit=20&offset=0
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const onlyFollowing = searchParams.get('following') === 'true'
  const limit = parseInt(searchParams.get('limit') ?? '20', 10)
  const _offset = searchParams.get('offset')

  // If no offset provided, use random offset
  const offset = _offset ? parseInt(_offset, 10) : undefined

  const me = await getCurrentUser()

  let query = supabaseAdmin
    .from('feed_posts')
    .select('*, restaurants!feed_posts_restaurant_id_fkey(id, name, city, michelin_stars, green_stars, description)')

  if (onlyFollowing && me) {
    const { data: follows } = await supabaseAdmin
      .from('follows')
      .select('followee_id')
      .eq('follower_id', me.id)

    const ids = follows?.map((f) => f.followee_id) ?? []
    if (ids.length > 0) {
      query = query.in('user_id', ids)
    }
  }

  if (offset === undefined) {
    // Get total count for random offset
    const { count } = await supabaseAdmin
      .from('feed_posts')
      .select('id', { count: 'exact', head: true })

    const totalPosts = count ?? 0
    const maxOffset = Math.max(0, totalPosts - (limit * 2))
    const randomOffset = Math.floor(Math.random() * maxOffset)

    query = query.range(randomOffset, randomOffset + (limit * 2) - 1)
  } else {
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  }

  const { data: initialData, error } = await query
  if (error) return apiError(ServerError(error.message))
  let data = initialData

  // Deduplicate restaurants: max 1 post per restaurant in results
  if (offset === undefined && data) {
    const seen = new Set<string>()
    data = data.filter(p => {
      if (seen.has(p.restaurant_id)) return false
      seen.add(p.restaurant_id)
      return true
    }).slice(0, limit)
  }

  if (!me || !data || data.length === 0) {
    return NextResponse.json(data)
  }

  const postIds = data.map((p) => p.id)

  const [{ data: likes }, { data: bookmarks }] = await Promise.all([
    supabaseAdmin.from('feed_likes').select('post_id').eq('user_id', me.id).in('post_id', postIds),
    supabaseAdmin.from('feed_bookmarks').select('post_id').eq('user_id', me.id).in('post_id', postIds),
  ])

  const likedIds = new Set((likes ?? []).map((l) => l.post_id))
  const bookmarkedIds = new Set((bookmarks ?? []).map((b) => b.post_id))

  return NextResponse.json(
    data.map((p) => ({
      ...p,
      user_liked: likedIds.has(p.id),
      user_bookmarked: bookmarkedIds.has(p.id),
    }))
  )
}
