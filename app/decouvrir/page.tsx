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
  michelin_stars: number
  green_stars: boolean
}

type User = {
  id: string
  username: string
  avatar_url: string | null
  role: string
}

type Filters = {
  ville: string
  occasion: string
  budget: number
  cuisine: string
}

const DEFAULT_FILTERS: Filters = { ville: '', occasion: '', budget: 0, cuisine: '' }

const SESSION_KEY = 'decouvrir_query'

export default function DecouvrirPage() {
  const { data: session } = useSession()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLight, setIsLight] = useState(false)
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined') return sessionStorage.getItem(SESSION_KEY) ?? ''
    return ''
  })
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [pendingFilters, setPendingFilters] = useState<Filters>(DEFAULT_FILTERS)

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
    if (!q.trim() && !f) { setRestaurants([]); setUsers([]); return }
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q)
      if (f?.ville) params.set('ville', f.ville)
      if (f?.occasion) params.set('occasion', f.occasion)
      if (f?.cuisine) params.set('cuisine', f.cuisine)
      if (f?.budget && f.budget < 500) params.set('budget', String(f.budget))
      const res = await fetch(`/api/search?${params}`)
      const data = await res.json()
      setRestaurants(data.restaurants ?? [])
      setUsers(data.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      if (isSearching) search(query)
      else { setRestaurants([]); setUsers([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [query, isSearching, search])

  const handleValider = () => {
    setFilters(pendingFilters)
    search('', pendingFilters)
  }

  const hasActiveFilters = filters.ville || filters.occasion || filters.cuisine || filters.budget < 500

  const iconStroke = isLight ? '#262626' : 'white'
  const cardBg = isLight ? 'bg-white border-black/[0.07]' : 'bg-neutral-900 border-white/[0.06]'
  const inputCls = 'w-full rounded-xl px-3 py-3 text-white text-xs placeholder:text-white/50 outline-none border-0'

  return (
    <div className={`min-h-screen pb-28 ${isLight ? 'bg-[#F5F5F5] text-[#262626]' : 'bg-black text-white'}`}>

      {/* ── Search bar ───────────────────────────── */}
      <div className={`sticky top-0 z-20 backdrop-blur-xl px-4 pt-14 pb-4 ${isLight ? 'bg-[#F5F5F5]/95' : 'bg-black/95'}`}>
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 border ${isLight ? 'bg-white border-black/[0.07]' : 'bg-neutral-900 border-white/[0.06]'}`}>
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
            <div className="mb-4 flex flex-col gap-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className={`w-5 h-5 border-2 rounded-full animate-spin ${isLight ? 'border-black/20 border-t-black' : 'border-white/20 border-t-white'}`} />
                </div>
              )}
              {!loading && restaurants.map(r => <RestaurantResult key={r.id} r={r} isLight={isLight} />)}
            </div>
          )}

          {/* —ou— */}
          <div className="flex items-center gap-3 my-5">
            <div className={`flex-1 h-px ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />
            <span className={`text-xs font-medium ${isLight ? 'text-black/30' : 'text-white/30'}`}>ou</span>
            <div className={`flex-1 h-px ${isLight ? 'bg-black/10' : 'bg-white/10'}`} />
          </div>

          {/* Grille de filtres */}
          <div className="grid grid-cols-2 gap-3 mb-4" style={{ gridAutoRows: 'calc((100dvh - 370px) / 2)' }}>

            <div className={`rounded-2xl p-5 border flex flex-col justify-between ${cardBg}`}>
              <p className={`text-xs font-semibold leading-tight ${isLight ? 'text-[#262626]/60' : 'text-white/60'}`}>Dans quelle ville ?</p>
              <input type="text" value={pendingFilters.ville} onChange={e => setPendingFilters(f => ({ ...f, ville: e.target.value }))} placeholder="Votre réponse" className={inputCls} style={{ background: '#D3072C' }} />
            </div>

            <div className={`rounded-2xl p-5 border flex flex-col justify-between ${cardBg}`}>
              <p className={`text-xs font-semibold leading-tight ${isLight ? 'text-[#262626]/60' : 'text-white/60'}`}>Quelle est l&apos;occasion ?</p>
              <input type="text" value={pendingFilters.occasion} onChange={e => setPendingFilters(f => ({ ...f, occasion: e.target.value }))} placeholder="Votre réponse" className={inputCls} style={{ background: '#D3072C' }} />
            </div>

            <div className={`rounded-2xl p-5 border flex flex-col justify-between ${cardBg}`}>
              <p className={`text-xs font-semibold leading-tight ${isLight ? 'text-[#262626]/60' : 'text-white/60'}`}>Quel est votre budget ?</p>
              <div>
                <input type="range" min={0} max={500} step={25} value={pendingFilters.budget} onChange={e => setPendingFilters(f => ({ ...f, budget: Number(e.target.value) }))} className="w-full accent-[#E4002B]" />
                <div className="flex justify-between mt-2">
                  <span className={`text-[10px] ${isLight ? 'text-black/30' : 'text-white/30'}`}>0</span>
                  <span className={`text-[10px] font-semibold ${isLight ? 'text-black/70' : 'text-white/70'}`}>
                    {pendingFilters.budget === 0 ? '—' : pendingFilters.budget >= 500 ? '+500€' : `${pendingFilters.budget}€`}
                  </span>
                </div>
              </div>
            </div>

            <div className={`rounded-2xl p-5 border flex flex-col justify-between ${cardBg}`}>
              <p className={`text-xs font-semibold leading-tight ${isLight ? 'text-[#262626]/60' : 'text-white/60'}`}>Que souhaitez-vous manger ?</p>
              <input type="text" value={pendingFilters.cuisine} onChange={e => setPendingFilters(f => ({ ...f, cuisine: e.target.value }))} placeholder="Votre réponse" className={inputCls} style={{ background: '#D3072C' }} />
            </div>

          </div>

          {(() => {
            const hasAny = pendingFilters.ville || pendingFilters.occasion || pendingFilters.cuisine || pendingFilters.budget > 0
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
        <p className={`font-semibold text-sm truncate ${isLight ? 'text-[#262626]' : 'text-white'}`}>{r.name}</p>
        <p className={`text-xs mt-0.5 truncate ${isLight ? 'text-black/30' : 'text-white/30'}`}>
          <span className={isLight ? 'text-black/20' : 'text-white/25'}>Restaurant · </span>{r.city}
        </p>
        {(r.michelin_stars > 0 || r.green_stars) && (
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: r.michelin_stars }).map((_, i) => (
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
