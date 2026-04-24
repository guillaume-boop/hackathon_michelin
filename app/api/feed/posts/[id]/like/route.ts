import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, UnauthorizedError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const me = await getCurrentUser()

  const [{ count }, { data: myLike }] = await Promise.all([
    supabaseAdmin.from('feed_likes').select('*', { count: 'exact', head: true }).eq('post_id', params.id),
    me
      ? supabaseAdmin.from('feed_likes').select('user_id').eq('post_id', params.id).eq('user_id', me.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  return NextResponse.json({ count: count ?? 0, liked: !!myLike })
}

async function syncLikesCount(postId: string) {
  const { count } = await supabaseAdmin
    .from('feed_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  await supabaseAdmin
    .from('feed_posts')
    .update({ likes_count: count ?? 0 })
    .eq('id', postId)
}

export async function POST(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { error } = await supabaseAdmin
    .from('feed_likes')
    .insert({ post_id: params.id, user_id: me.id })

  if (error) return apiError(ServerError(error.message))
  await syncLikesCount(params.id)
  return new NextResponse(null, { status: 204 })
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { error } = await supabaseAdmin
    .from('feed_likes')
    .delete()
    .eq('post_id', params.id)
    .eq('user_id', me.id)

  if (error) return apiError(ServerError(error.message))
  await syncLikesCount(params.id)
  return new NextResponse(null, { status: 204 })
}
