'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import { logRestaurantOnChain } from '@/lib/xrp'

function parseRestaurantForm(formData: FormData) {
  return {
    name: formData.get('name') as string,
    city: formData.get('city') as string,
    country: formData.get('country') as string,
    michelin_stars: parseInt(formData.get('michelin_stars') as string, 10),
    green_stars: formData.get('green_stars') === 'true',
    dietary_option: (formData.get('dietary_option') as string) || null,
    description: (formData.get('description') as string) || null,
  }
}

export async function createRestaurant(formData: FormData) {
  const payload = parseRestaurantForm(formData)
  const { data, error } = await supabaseAdmin.from('restaurants').insert(payload).select('id').single()
  if (error) throw new Error(error.message)

  try {
    const txHash = await logRestaurantOnChain(payload)
    await supabaseAdmin.from('restaurants').update({ xrp_tx_hash: txHash }).eq('id', data.id)
  } catch {
    // non-fatal: restaurant saved, blockchain log failed silently
  }

  revalidatePath('/admin/restaurants')
  redirect('/admin/restaurants')
}

export async function updateRestaurant(id: string, formData: FormData) {
  const { error } = await supabaseAdmin.from('restaurants').update(parseRestaurantForm(formData)).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/restaurants')
  redirect('/admin/restaurants')
}

export async function deleteRestaurant(id: string) {
  const { error } = await supabaseAdmin.from('restaurants').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/restaurants')
}
