import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, NotFoundError, UnauthorizedError, ServerError } from '@/lib/errors'

type Params = { params: { id: string; dishId: string } }

async function assertOwner(chefId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('chef_profiles')
    .select('user_id')
    .eq('id', chefId)
    .single()
  return data?.user_id === userId
}

export async function PATCH(request: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())
  if (!(await assertOwner(params.id, me.id))) return apiError(UnauthorizedError())

  const body = await request.json()
  const { name, description, photo_url, order } = body

  const { data, error } = await supabaseAdmin
    .from('chef_signature_dishes')
    .update({ name, description, photo_url, order })
    .eq('id', params.dishId)
    .eq('chef_profile_id', params.id)
    .select()
    .single()

  if (error) return apiError(NotFoundError('Plat introuvable'))
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())
  if (!(await assertOwner(params.id, me.id))) return apiError(UnauthorizedError())

  const { error } = await supabaseAdmin
    .from('chef_signature_dishes')
    .delete()
    .eq('id', params.dishId)
    .eq('chef_profile_id', params.id)

  if (error) return apiError(ServerError(error.message))
  return new NextResponse(null, { status: 204 })
}
