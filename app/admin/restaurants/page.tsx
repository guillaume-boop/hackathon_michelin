import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { deleteRestaurant } from '../actions'

export default async function AdminRestaurantsPage() {
  const { data: restaurants } = await supabaseAdmin
    .from('restaurants')
    .select('id, name, city, country, michelin_stars, green_stars, dietary_option')
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Restaurants</h1>
          <p className="text-white/40 text-sm mt-1">{restaurants?.length ?? 0} establishments</p>
        </div>
        <Link
          href="/admin/restaurants/new"
          className="bg-[#E4002B] hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Add restaurant
        </Link>
      </div>

      <div className="bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Name</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Location</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Stars</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Green</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Dietary</th>
              <th className="px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {restaurants?.map((r) => (
              <tr key={r.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4 font-semibold">{r.name}</td>
                <td className="px-5 py-4 text-white/50">{r.city}, {r.country}</td>
                <td className="px-5 py-4">
                  {r.michelin_stars > 0
                    ? <span className="text-amber-400 font-semibold">{'★'.repeat(r.michelin_stars)}</span>
                    : <span className="text-white/20">—</span>}
                </td>
                <td className="px-5 py-4">
                  {r.green_stars
                    ? <span className="text-green-400 text-xs font-semibold">🌿 Yes</span>
                    : <span className="text-white/20">—</span>}
                </td>
                <td className="px-5 py-4 text-white/50 capitalize">{r.dietary_option ?? '—'}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/admin/restaurants/${r.id}/edit`}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors"
                    >
                      Edit
                    </Link>
                    <form action={deleteRestaurant.bind(null, r.id)}>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-[#E4002B] text-xs font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!restaurants?.length && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-white/30 text-sm">
                  No restaurants yet. Add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
