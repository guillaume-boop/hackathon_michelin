import Link from 'next/link'
import { createRestaurant } from '../../actions'
import RestaurantForm from '../RestaurantForm'

export default function NewRestaurantPage() {
  return (
    <div>
      <div className="mb-8">
        <Link href="/admin/restaurants" className="text-white/40 hover:text-white text-sm transition-colors">
          ← Restaurants
        </Link>
        <h1 className="text-2xl font-black tracking-tight mt-3">Nouveau restaurant</h1>
        <p className="text-white/40 text-sm mt-1">Ajouter un nouvel établissement au guide.</p>
      </div>
      <div className="bg-neutral-900 rounded-2xl border border-white/10 p-6">
        <RestaurantForm action={createRestaurant} submitLabel="Créer le restaurant" />
      </div>
    </div>
  )
}
