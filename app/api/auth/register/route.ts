import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { apiError, BadRequestError, ServerError } from '@/lib/errors'

export async function POST(request: Request) {
  const body = await request.json()
  const { email, password, username } = body

  if (!email || !password || !username) {
    return apiError(BadRequestError('Champs requis: email, password, username'))
  }
  if (password.length < 6) {
    return apiError(BadRequestError('Le mot de passe doit faire au moins 6 caractères'))
  }

  // Check email not already taken
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', email)
    .single()

  if (existing) return apiError(BadRequestError('Cet email est déjà utilisé'))

  const password_hash = await bcrypt.hash(password, 10)

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({ email, username, password_hash, role: 'user', circle_score: 0 })
    .select('id, email, username, role, circle_score, created_at')
    .single()

  if (error) return apiError(ServerError(error.message))
  return NextResponse.json(data, { status: 201 })
}
