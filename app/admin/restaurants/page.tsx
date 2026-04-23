/* eslint-disable react/no-unescaped-entities */
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { deleteRestaurant } from '../actions'
import { XRP_EXPLORER } from '@/lib/xrp'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

export default async function AdminRestaurantsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string }
}) {
  const q = searchParams.q?.trim() ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let query = supabaseAdmin
    .from('restaurants')
    .select('id, name, city, country, michelin_stars, green_stars, dietary_option, xrp_tx_hash', { count: 'exact' })
    .order('name')
    .range(from, to)

  if (q) query = query.ilike('name', `%${q}%`)

  const { data: restaurants, error, count } = await query

  if (error) console.error('[admin/restaurants] erreur:', error.message)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Restaurants</h1>
          <p className="text-white/40 text-sm mt-1">
            {count?.toLocaleString('fr-FR') ?? 0} établissement{(count ?? 0) > 1 ? 's' : ''}
            {q && <span className="ml-1">· recherche "{q}"</span>}
          </p>
        </div>
        <Link
          href="/admin/restaurants/new"
          className="bg-[#E4002B] hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          + Ajouter un restaurant
        </Link>
      </div>

      {/* Barre de recherche */}
      <form method="GET" className="mb-5">
        <input
          name="q"
          defaultValue={q}
          placeholder="Rechercher par nom…"
          className="w-full max-w-sm bg-neutral-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/30 transition-colors"
        />
      </form>

      <div className="bg-neutral-900 rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Nom</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Localisation</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Étoiles</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Vert</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Régime</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/40 uppercase tracking-wide">Blockchain</th>
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
                    ? <span className="text-green-400 text-xs font-semibold">🌿 Oui</span>
                    : <span className="text-white/20">—</span>}
                </td>
                <td className="px-5 py-4 text-white/50 capitalize">{r.dietary_option ?? '—'}</td>
                <td className="px-5 py-4">
                  {r.xrp_tx_hash ? (
                    <a
                      href={`${XRP_EXPLORER}/${r.xrp_tx_hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-950/60 hover:bg-blue-900/60 text-blue-400 text-xs font-medium transition-colors"
                    >
                      XRP ↗
                    </a>
                  ) : (
                    <span className="text-white/20">—</span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <Link
                      href={`/admin/restaurants/${r.id}/edit`}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-colors"
                    >
                      Modifier
                    </Link>
                    <form action={deleteRestaurant.bind(null, r.id)}>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-[#E4002B] text-xs font-medium transition-colors"
                      >
                        Supprimer
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {!restaurants?.length && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-white/30 text-sm">
                  {q ? `Aucun résultat pour "${q}".` : 'Aucun restaurant.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5 text-sm text-white/40">
          <span>Page {page} sur {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?q=${q}&page=${page - 1}`}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
              >
                ← Précédent
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?q=${q}&page=${page + 1}`}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 transition-colors"
              >
                Suivant →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
