import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { supabaseAdmin } from './supabase'
import type { User } from '@/types/User'

export async function getCurrentUser(): Promise<User | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  const { data } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return data ?? null
}
