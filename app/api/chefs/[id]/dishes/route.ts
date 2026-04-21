import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/session'
import { apiError, NotFoundError, UnauthorizedError, BadRequestError, ServerError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabaseAdmin
    .from('chef_signature_dishes')
    .select('*')
    .eq('chef_profile_id', params.id)
    .order('order', { ascending: true })

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data)
}

export async function POST(request: Request, { params }: Params) {
  const me = await getCurrentUser()
  if (!me) return apiError(UnauthorizedError())

  const { data: chef } = await supabaseAdmin
    .from('chef_profiles')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (!chef) return apiError(NotFoundError('Profil chef introuvable'))
  if (chef.user_id !== me.id) return apiError(UnauthorizedError())

  const body = await request.json()
  const { name, description = null, photo_url = null, order = 0 } = body
  if (!name) return apiError(BadRequestError('Champ requis: name'))

  const { data, error } = await supabaseAdmin
    .from('chef_signature_dishes')
    .insert({ chef_profile_id: params.id, name, description, photo_url, order })
    .select()
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data, { status: 201 })
}
