import { NextResponse } from 'next/server'
import { supabaseAdmin as supabase } from '@/lib/supabase'
import { apiError, NotFoundError } from '@/lib/errors'

type Params = { params: { id: string } }

export async function GET(_req: Request, { params }: Params) {
  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return apiError(NotFoundError('Restaurant introuvable'))
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: Params) {
  const body = await request.json()

  const { data, error } = await supabase
    .from('restaurants')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return apiError(NotFoundError('Restaurant introuvable'))
  return NextResponse.json(data)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { error } = await supabase.from('restaurants').delete().eq('id', params.id)

  if (error) return apiError(NotFoundError('Restaurant introuvable'))
  return new NextResponse(null, { status: 204 })
}
