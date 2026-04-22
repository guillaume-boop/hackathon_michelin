'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Stars from '@/components/ui/Stars'
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

const SUGGESTIONS = ['Paris', 'Tokyo', 'Noma', 'Septime', 'Guy Savoy', 'Lyon', 'Vegan']

export default function DecouvrirPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<'restaurants' | 'users'>('restaurants')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [featured, setFeatured] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(false)

  // Load featured restaurants on mount
  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.json())
      .then(d => setFeatured(Array.isArray(d) ? d : []))
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setRestaurants([]); setUsers([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setRestaurants(data.restaurants ?? [])
      setUsers(data.users ?? [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 250)
    return () => clearTimeout(t)
  }, [query, search])

  const isSearching = query.trim().length > 0
  const hasResults = restaurants.length > 0 || users.length > 0

  return (
    <div className="bg-neutral-950 min-h-screen text-white pb-28">

      {/* ── Header + search bar ───────────────── */}
      <div className="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-xl px-4 pt-14 pb-3">
        <h1 className="text-xl font-black mb-3">Découvrir</h1>
        <div className="flex items-center gap-2 bg-neutral-900 rounded-2xl px-4 py-3 border border-white/5">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-4 h-4 opacity-40 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Restaurant, chef, ville…"
            className="flex-1 bg-transparent text-white text-sm placeholder:text-white/30 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="opacity-40 active:opacity-100">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs — only when searching */}
        {isSearching && hasResults && (
          <div className="flex gap-1.5 mt-3">
            {(['restaurants', 'users'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${tab === t ? 'bg-white text-black' : 'text-white/40'}`}
              >
                {t === 'restaurants'
                  ? `Restaurants${restaurants.length ? ` (${restaurants.length})` : ''}`
                  : `Utilisateurs${users.length ? ` (${users.length})` : ''}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Suggestions chips ─────────────────── */}
      {!isSearching && (
        <div className="px-4 pt-2 pb-4 flex gap-2 overflow-x-auto">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setQuery(s)}
              className="flex-shrink-0 px-4 py-2 rounded-full bg-neutral-900 border border-white/5 text-white/60 text-xs font-semibold"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Loading ───────────────────────────── */}
      {loading && (
        <div className="flex justify-center pt-16">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* ── No results ────────────────────────── */}
      {!loading && isSearching && !hasResults && (
        <div className="flex flex-col items-center pt-20 px-8 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-white font-bold text-sm mb-1">Aucun résultat</p>
          <p className="text-white/30 text-xs">Essaie un autre nom ou une ville</p>
        </div>
      )}

      {/* ── Search results ────────────────────── */}
      {!loading && isSearching && hasResults && (
        <div className="px-4 flex flex-col gap-2">

          {tab === 'restaurants' && restaurants.map(r => (
            <RestaurantRow key={r.id} r={r} />
          ))}

          {tab === 'users' && users.map(u => (
            <UserRow key={u.id} u={u} />
          ))}

        </div>
      )}

      {/* ── Featured (no search) ──────────────── */}
      {!isSearching && featured.length > 0 && (
        <div className="px-4">

          {/* 3★ highlight */}
          {(() => {
            const top = featured.filter(r => r.michelin_stars === 3)
            if (!top.length) return null
            return (
              <section className="mb-7">
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3">3 Étoiles Michelin</p>
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
                  {top.map(r => <RestaurantCard key={r.id} r={r} tall />)}
                </div>
              </section>
            )
          })()}

          {/* Green stars */}
          {(() => {
            const green = featured.filter(r => r.green_stars)
            if (!green.length) return null
            return (
              <section className="mb-7">
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3">🌿 Étoile Verte</p>
                <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1">
                  {green.map(r => <RestaurantCard key={r.id} r={r} />)}
                </div>
              </section>
            )
          })()}

          {/* All */}
          <section className="mb-7">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-3">Tous les restaurants</p>
            <div className="flex flex-col gap-2">
              {featured.map(r => <RestaurantRow key={r.id} r={r} />)}
            </div>
          </section>

        </div>
      )}

      <BottomNav />
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RestaurantCard({ r, tall }: { r: Restaurant; tall?: boolean }) {
  const seed = r.id.replace(/-/g, '').slice(0, 8)
  return (
    <Link
      href={`/restaurant/${r.id}`}
      className={`relative flex-shrink-0 rounded-2xl overflow-hidden bg-neutral-900 ${tall ? 'w-44 h-64' : 'w-36 h-48'}`}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/400/600)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        {(r.michelin_stars > 0 || r.green_stars) && (
          <div className="mb-1">
            <Stars count={r.michelin_stars} green={r.green_stars} size="xs" variant="overlay" />
          </div>
        )}
        <p className="text-white font-black text-xs leading-tight line-clamp-2">{r.name}</p>
        <p className="text-white/50 text-[10px] mt-0.5">{r.city}</p>
      </div>
    </Link>
  )
}

function RestaurantRow({ r }: { r: Restaurant }) {
  const seed = r.id.replace(/-/g, '').slice(0, 8)
  return (
    <Link
      href={`/restaurant/${r.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900 border border-white/5 active:bg-neutral-800 transition-colors"
    >
      <div
        className="w-14 h-14 rounded-xl bg-cover bg-center flex-shrink-0"
        style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/120/120)` }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white font-black text-sm truncate">{r.name}</p>
        <p className="text-white/40 text-xs mt-0.5">{r.city}, {r.country}</p>
        {(r.michelin_stars > 0 || r.green_stars) && (
          <div className="mt-1">
            <Stars count={r.michelin_stars} green={r.green_stars} size="xs" />
          </div>
        )}
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-4 h-4 opacity-20 flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

function UserRow({ u }: { u: User }) {
  const avatarUrl = u.avatar_url ?? `https://picsum.photos/seed/${u.username}/100/100`
  return (
    <Link
      href={`/chef/${u.id}`}
      className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900 border border-white/5 active:bg-neutral-800 transition-colors"
    >
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-neutral-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-black text-sm">@{u.username}</p>
        <p className="text-white/30 text-xs mt-0.5">{u.role === 'chef' ? '👨‍🍳 Chef' : '🍽 Gastronome'}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-4 h-4 opacity-20 flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  )
}
