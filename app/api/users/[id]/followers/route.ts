import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { apiError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from('follows')
    .select('follower_id, created_at, users!follows_follower_id_fkey(id, username, avatar_url)')
    .eq('followee_id', params.id)

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}
