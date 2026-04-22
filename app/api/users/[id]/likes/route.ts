import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { apiError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const [feedRes, expRes] = await Promise.all([
    supabaseAdmin
      .from('feed_likes')
      .select('post_id, feed_posts(id, content_url, restaurant_id, restaurants(id, name, description))')
      .eq('user_id', params.id),
    supabaseAdmin
      .from('experience_likes')
      .select('experience_id, experiences(id, rating, note, visited_at, restaurant_id, restaurants(id, name))')
      .eq('user_id', params.id),
  ])

  if (feedRes.error) return apiError(ServerError(feedRes.error.message))
  if (expRes.error) return apiError(ServerError(expRes.error.message))

  const feedItems = (feedRes.data ?? []).map((row: any) => ({ type: 'feed', ...row.feed_posts }))
  const expItems = (expRes.data ?? []).map((row: any) => ({ type: 'experience', ...row.experiences }))

  return NextResponse.json([...feedItems, ...expItems])
}
