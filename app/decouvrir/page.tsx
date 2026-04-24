'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'

type Restaurant = {
  id: string
  name: string
  city: string
  country: string
  michelin_stars?: number
  green_stars?: boolean
  price_range?: string
  cuisine?: string
  facilities?: string[]
}

type User = {
  id: string
  username: string
  avatar_url: string | null
  role: string
}

type Filters = {
  ville: string
  michelin_stars: number | null
  budget: number | null
  cuisine: string
}

const DEFAULT_FILTERS: Filters = { ville: '', michelin_stars: null, budget: null, cuisine: '' }

const CUISINE_OPTIONS = ['Modern', 'Contemporary', 'French', 'Nordic', 'Seafood', 'Mediterranean', 'Vegetarian', 'Japanese', 'Asian', 'Italian', 'Spanish', 'North American']

const BUDGET_LABELS = ['€', '€€', '€€€', '€€€€']

const FILTERS_STORAGE_KEY = 'decouvrir_active_filters'
const RESULTS_STORAGE_KEY = 'decouvrir_active_results'

const SESSION_KEY = 'decouvrir_query'

export default function DecouvrirPage() {
  const { data: session } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLight, setIsLight] = useState(true)
  const [query, setQuery] = useState('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [pendingFilters, setPendingFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [mounted, setMounted] = useState(false)

  // Restore query, filters and restaurants from sessionStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedQuery = sessionStorage.getItem(SESSION_KEY)
    if (savedQuery) setQuery(savedQuery)

    const savedFilters = sessionStorage.getItem(FILTERS_STORAGE_KEY)
    const savedResults = sessionStorage.getItem(RESULTS_STORAGE_KEY)
    if (savedFilters && savedResults) {
      const parsedFilters = JSON.parse(savedFilters)
      const hasFilters = parsedFilters.ville || parsedFilters.michelin_stars !== null || parsedFilters.cuisine || parsedFilters.budget !== null
      if (hasFilters) {
        setFilters(parsedFilters)
        setRestaurants(JSON.parse(savedResults))
      }
    }
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    setIsLight(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsLight(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    sessionStorage.setItem(SESSION_KEY, query)
  }, [query])

  useEffect(() => {
    const uid = (session?.user as { id?: string })?.id
    if (!uid) return
    fetch(`/api/users/${uid}/following`)
      .then(r => r.json())
      .then((data: unknown) => {
        const rows = Array.isArray(data) ? data : []
        const ids = new Set<string>(rows.map((u: { followee_id: string }) => u.followee_id))
        setFollowingIds(ids)
      })
      .catch(() => {})
  }, [session])

  const isSearching = query.trim().length > 0
  const hasResults = restaurants.length > 0 || users.length > 0

  const search = useCallback(async (q: string, f?: Filters) => {
    const hasQuery = q.trim().length > 0
    const hasFilters = f && (f.ville || f.michelin_stars !== null || f.budget !== null || f.cuisine)

    if (!hasQuery && !hasFilters) {
      setRestaurants([])
      setUsers([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (hasQuery) params.set('q', q)
      if (f) {
        if (f.ville) params.set('ville', f.ville)
        if (f.michelin_stars !== null && f.michelin_stars !== undefined) params.set('michelin_stars', String(f.michelin_stars))
        if (f.budget !== null && f.budget !== undefined) params.set('budget', String(f.budget))
        if (f.cuisine) params.set('cuisine', f.cuisine)
      }
      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()
      setRestaurants(data.restaurants ?? [])
      setUsers(data.users ?? [])
      // Save restaurants to sessionStorage for when user comes back from restaurant page
      if (data.restaurants && data.restaurants.length > 0) {
        sessionStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(data.restaurants))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      const hasFilters = filters.ville || filters.michelin_stars !== null || filters.cuisine || filters.budget !== null
      if (isSearching) search(query)
      else if (!hasFilters) { setRestaurants([]); setUsers([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [query, isSearching, search, filters])

  const handleValider = () => {
    setFilters(pendingFilters)
    sessionStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(pendingFilters))
    search('', pendingFilters)
  }

  const hasActiveFilters = filters.ville || filters.michelin_stars !== null || filters.cuisine || filters.budget !== null

  const iconStroke = isLight ? '#262626' : 'white'
  const cardBg = isLight ? 'bg-white border-black/[0.07]' : 'bg-neutral-900 border-white/[0.06]'
  const inputCls = `w-full rounded-xl px-3 py-3 text-xs outline-none border-0 ${isLight ? 'text-[#262626] placeholder:text-black/30' : 'text-white placeholder:text-white/50'}`

  return (
    <div className={`min-h-screen pb-28 ${isLight ? 'bg-[#F5F5F5] text-[#262626]' : 'bg-black text-white'}`}>

      {/* ── Search bar ───────────────────────────── */}
      {!hasActiveFilters && (
        <div className={`sticky top-0 z-20 backdrop-blur-xl px-4 pt-14 pb-4 ${isLight ? 'bg-[#F5F5F5]/95' : 'bg-black/95'}`}>
          <div className={`flex items-center gap-2 ${query ? '' : 'justify-center'}`}>
            {query && (
              <button
                onClick={() => { setQuery(''); setFilters(DEFAULT_FILTERS); setPendingFilters(DEFAULT_FILTERS) }}
                className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className={`${query ? 'flex-1' : 'w-full'} flex items-center gap-2 rounded-2xl pl-3 pr-3 py-2.5 border ${isLight ? 'bg-white border-black/[0.07]' : 'bg-neutral-900 border-white/[0.06]'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth={1.5} className="w-4 h-4 opacity-40 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Restaurant, chef, ville…"
                className={`flex-1 bg-transparent text-sm outline-none ${isLight ? 'text-[#262626] placeholder:text-black/30' : 'text-white placeholder:text-white/30'}`}
              />
              {query && (
                <button onClick={() => setQuery('')} className="opacity-40 active:opacity-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth={2} className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Back button (when showing filtered results) ───────── */}
      {hasActiveFilters && (
        <div className={`sticky top-0 z-20 backdrop-blur-xl px-4 pt-14 pb-4 ${isLight ? 'bg-[#F5F5F5]/95' : 'bg-black/95'}`}>
          <button
            onClick={() => { setQuery(''); setFilters(DEFAULT_FILTERS); setPendingFilters(DEFAULT_FILTERS) }}
            className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke={iconStroke} strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className={`text-sm font-semibold ${isLight ? 'text-[#262626]' : 'text-white'}`}>Retour</span>
          </button>
        </div>
      )}

      {/* ── Live search results ───────────────────── */}
      {isSearching && (
        <div className="pt-1">
          {loading && (
            <div className="flex justify-center pt-12">
              <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isLight ? 'border-black/20 border-t-black' : 'border-white/20 border-t-white'}`} />
            </div>
          )}
          {!loading && !hasResults && (
            <div className="flex flex-col items-center pt-20 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className={`font-bold text-sm mb-1 ${isLight ? 'text-[#262626]' : 'text-white'}`}>Aucun résultat</p>
              <p className={`text-xs ${isLight ? 'text-black/30' : 'text-white/30'}`}>Essaie un autre nom ou une ville</p>
            </div>
          )}
          {!loading && hasResults && (
            <div>
              {(() => {
                const sortedUsers = [...users].sort((a, b) =>
                  (followingIds.has(b.id) ? 1 : 0) - (followingIds.has(a.id) ? 1 : 0)
                )
                const allItems = [
                  ...sortedUsers.map(u => ({ type: 'user' as const, data: u })),
                  ...restaurants.map(r => ({ type: 'restaurant' as const, data: r })),
                ]
                return allItems.map((item, i) => (
                  <SearchRow key={`${item.type}-${item.data.id}`} last={i === allItems.length - 1} isLight={isLight}>
                    {item.type === 'user'
                      ? <UserResult u={item.data as User} isFollowed={followingIds.has(item.data.id)} isLight={isLight} />
                      : <RestaurantResult r={item.data as Restaurant} isLight={isLight} />
                    }
                  </SearchRow>
                ))
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Filtres (barre vide) ──────────────────── */}
      {!isSearching && (
        <div className="px-4 pt-2">

          {hasActiveFilters && (
            <div className="px-4">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isLight ? 'border-black/20 border-t-black' : 'border-white/20 border-t-white'}`} />
                </div>
              )}
              {!loading && restaurants.length === 0 && (
                <div className="flex flex-col items-center justify-center pt-20 text-center">
                  <p className="text-3xl mb-3">🔍</p>
                  <p className={`font-bold text-sm mb-1 ${isLight ? 'text-[#262626]' : 'text-white'}`}>Aucun résultat</p>
                  <p className={`text-xs ${isLight ? 'text-black/30' : 'text-white/30'}`}>Essaie d&apos;autres filtres</p>
                </div>
              )}
              {!loading && restaurants.length > 0 && (
                <div>
                  {restaurants.map((r, i) => (
                    <SearchRow key={r.id} last={i === restaurants.length - 1} isLight={isLight}>
                      <RestaurantResult r={r} isLight={isLight} />
                    </SearchRow>
                  ))}
                </div>
              )}
            </div>
          )}

          {!hasActiveFilters && (
            <>
              {/* —ou— */}
              <div className="flex items-center gap-3 my-5">
                <div className={`flex-1 h-px ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />
                <span className={`text-xs font-medium ${isLight ? 'text-black/30' : 'text-white/30'}`}>ou</span>
                <div className={`flex-1 h-px ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />
              </div>

              {/* Grille de filtres */}
              <div className="grid grid-cols-2 gap-3 mb-4" style={{ gridAutoRows: 'minmax(140px, auto)' }}>

            {/* Ville */}
            <div className={`rounded-2xl p-3 border flex flex-col justify-between ${cardBg}`}>
              <p className={`text-xs font-semibold leading-tight ${isLight ? 'text-[#262626]/60' : 'text-white/60'}`}>Quelle ville ?</p>
              <input type="text" value={pendingFilters.ville} onChange={e => setPendingFilters(f => ({ ...f, ville: e.target.value }))} placeholder="Paris, Tokyo…" className={inputCls} style={{ background: isLight ? '#f0f0f0' : '#2d2d2d' }} />
            </div>

            {/* Michelin Stars */}
            <div className={`rounded-2xl p-3 border flex flex-col justify-between ${cardBg}`}>
              <p className={`text-xs font-semibold leading-tight ${isLight ? 'text-[#262626]/60' : 'text-white/60'}`}>Étoiles Michelin</p>
              <div className="grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map(stars => (
                  <button
                    key={stars}
                    onClick={() => setPendingFilters(f => ({ ...f, michelin_stars: f.michelin_stars === stars ? null : stars }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                      pendingFilters.michelin_stars === stars
                        ? 'bg-[#E4002B]'
                        : isLight ? 'bg-black/5' : 'bg-white/10'
                    }`}
                  >
                    {stars === 0 ? (
                      <span className={isLight ? 'text-[#262626]' : 'text-white'}>-</span>
                    ) : (
                      <>
                        {Array.from({ length: stars }).map((_, i) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={i}
                            src="/icons/etoile-michelin.svg"
                            alt="★"
                            width={16}
                            height={16}
                            style={{
                              filter: pendingFilters.michelin_stars === stars ? 'brightness(0) invert(1)' : 'none',
                              flexShrink: 0,
                              marginRight: i < stars - 1 ? '2px' : '0'
                            }}
                          />
                        ))}
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div className={`rounded-2xl p-3 border flex flex-col justify-between ${cardBg}`}>
              <p className={`text-xs font-semibold leading-tight ${isLight ? 'text-[#262626]/60' : 'text-white/60'}`}>Budget</p>
              <div className="flex flex-col gap-2">
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={pendingFilters.budget ?? 0}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    setPendingFilters(f => ({ ...f, budget: val === 0 ? null : val }))
                  }}
                  className="w-full accent-[#E4002B] cursor-pointer"
                />
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold ${isLight ? 'text-black/50' : 'text-white/50'}`}>Budget</span>
                  <span className={`text-sm font-bold ${isLight ? 'text-[#262626]' : 'text-white'}`}>
                    {pendingFilters.budget ? BUDGET_LABELS[pendingFilters.budget - 1] : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cuisine */}
            <div className={`rounded-2xl p-3 border flex flex-col justify-between ${cardBg}`}>
              <p className={`text-xs font-semibold leading-tight ${isLight ? 'text-[#262626]/60' : 'text-white/60'}`}>Type de cuisine</p>
              <select
                value={pendingFilters.cuisine}
                onChange={e => setPendingFilters(f => ({ ...f, cuisine: e.target.value }))}
                className={`w-full rounded-lg px-2 py-2 text-xs font-semibold ${isLight ? 'bg-black/5 text-[#262626] border-black/10' : 'bg-white/10 text-white border-white/10'} border outline-none`}
              >
                <option value="">Tous les types</option>
                {CUISINE_OPTIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

          </div>

              {(() => {
                const hasAny = pendingFilters.ville || pendingFilters.michelin_stars !== null || pendingFilters.cuisine || pendingFilters.budget !== null
                return (
                  <button
                    onClick={hasAny ? handleValider : undefined}
                    disabled={!hasAny}
                    className="w-full py-4 rounded-2xl text-white font-bold text-sm transition-all"
                    style={{ background: hasAny ? '#E4002B' : isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)', cursor: hasAny ? 'pointer' : 'default' }}
                  >
                    Valider
                  </button>
                )
              })()}
            </>
          )}

        </div>
      )}

      <BottomNav />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SearchRow({ children, last, isLight }: { children: React.ReactNode; last: boolean; isLight: boolean }) {
  return (
    <div className={`px-4 transition-colors ${isLight ? 'active:bg-black/5' : 'active:bg-white/5'} ${!last ? `border-b ${isLight ? 'border-black/[0.05]' : 'border-white/[0.05]'}` : ''}`}>
      {children}
    </div>
  )
}

function RestaurantResult({ r, isLight }: { r: Restaurant; isLight: boolean }) {
  const seed = r.id.replace(/-/g, '').slice(0, 8)
  return (
    <Link href={`/restaurant/${r.id}`} className="flex items-center gap-3 py-3">
      <div className="w-12 h-12 rounded-xl bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/120/120)` }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={`font-semibold text-sm truncate ${isLight ? 'text-[#262626]' : 'text-white'}`}>{r.name}</p>
          {r.price_range && <span className={`text-xs font-bold ${isLight ? 'text-black/50' : 'text-white/50'}`}>{r.price_range}</span>}
        </div>
        <p className={`text-xs mt-0.5 truncate ${isLight ? 'text-black/30' : 'text-white/30'}`}>
          <span className={isLight ? 'text-black/20' : 'text-white/25'}>Restaurant · </span>{r.city}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {((r.michelin_stars ?? 0) > 0 || r.green_stars) && (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: r.michelin_stars ?? 0 }).map((_, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src="/icons/etoile-michelin.svg" alt="" className="w-3 h-3" />
              ))}
              {r.green_stars && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/icons/etoile-michelin.svg" alt="" className="w-3 h-3"
                  style={{ filter: 'brightness(0) saturate(100%) invert(40%) sepia(80%) saturate(600%) hue-rotate(100deg) brightness(70%) contrast(110%)' }}
                />
              )}
            </div>
          )}
          {r.cuisine && (
            <p className={`text-xs ${isLight ? 'text-black/40' : 'text-white/40'}`}>
              {r.cuisine.split(',')[0].trim()}
            </p>
          )}
        </div>
      </div>
    </Link>
  )
}

function UserResult({ u, isFollowed, isLight }: { u: User; isFollowed: boolean; isLight: boolean }) {
  const avatarUrl = u.avatar_url ?? `https://picsum.photos/seed/${u.username}/100/100`
  const label = u.role === 'chef' ? 'Chef' : u.role === 'inspecteur' ? 'Inspecteur' : 'Gastronome'
  return (
    <Link href={`/user/${u.id}`} className="flex items-center gap-3 py-3">
      <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${isLight ? 'bg-neutral-200' : 'bg-neutral-800'}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`font-semibold text-sm truncate ${isLight ? 'text-[#262626]' : 'text-white'}`}>@{u.username}</p>
          {isFollowed && <FollowedBadge />}
        </div>
        <p className={`text-xs mt-0.5 ${isLight ? 'text-black/25' : 'text-white/25'}`}>{label}</p>
      </div>
    </Link>
  )
}

function FollowedBadge() {
  return (
    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(228,0,43,0.15)' }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="#E4002B" strokeWidth={2.5} className="w-2.5 h-2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
      </svg>
      <span className="text-[9px] font-bold" style={{ color: '#E4002B' }}>suivi</span>
    </span>
  )
}
