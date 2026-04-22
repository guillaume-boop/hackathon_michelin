import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { updateRestaurant } from '../../../actions'
import RestaurantForm from '../../RestaurantForm'

export default async function EditRestaurantPage({ params }: { params: { id: string } }) {
  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!restaurant) notFound()

  const action = updateRestaurant.bind(null, params.id)

  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/restaurants" className="text-white/40 hover:text-white text-sm transition-colors">
          ← Restaurants
        </Link>
        <h1 className="text-2xl font-black tracking-tight mt-3">Edit Restaurant</h1>
        <p className="text-white/40 text-sm mt-1">{restaurant.name}</p>
      </div>
      <div className="bg-neutral-900 rounded-2xl border border-white/10 p-6">
        <RestaurantForm action={action} defaultValues={restaurant} submitLabel="Save changes" />
      </div>
    </div>
  )
}
