'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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

type Tab = 'restaurants' | 'users'

const SUGGESTIONS = ['Paris', 'Tokyo', 'Guy Savoy', 'Noma', 'Septime', 'Wagyu', 'Vegan']

export default function SearchPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState<Tab>('restaurants')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { inputRef.current?.focus() }, [])

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

  const hasResults = restaurants.length > 0 || users.length > 0

  return (
    <div className="bg-neutral-950 min-h-screen text-white pb-28">

      {/* ── Search bar ─────────────────────── */}
      <div className="sticky top-0 z-20 bg-neutral-950/95 backdrop-blur-xl px-4 pt-14 pb-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 flex items-center gap-2 bg-neutral-900 rounded-xl px-3 py-2.5 border border-white/5">
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
              <button onClick={() => setQuery('')} className="opacity-40">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {hasResults && (
          <div className="flex gap-1 mt-3">
            {(['restaurants', 'users'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${tab === t ? 'bg-white text-black' : 'text-white/40'}`}
              >
                {t === 'restaurants' ? `Restaurants ${restaurants.length > 0 ? `(${restaurants.length})` : ''}` : `Utilisateurs ${users.length > 0 ? `(${users.length})` : ''}`}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Empty state / suggestions ─────── */}
      {!query && (
        <div className="px-4 pt-8">
          <p className="text-white/30 text-xs font-semibold uppercase tracking-widest mb-4">Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map(s => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="px-4 py-2 rounded-full bg-neutral-900 border border-white/5 text-white/70 text-sm font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Loading ───────────────────────── */}
      {loading && (
        <div className="flex justify-center pt-16">
          <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {/* ── No results ────────────────────── */}
      {!loading && query && !hasResults && (
        <div className="flex flex-col items-center justify-center pt-24 px-8 text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-white font-bold mb-1">Aucun résultat</p>
          <p className="text-white/40 text-sm">Essaie un autre nom ou une ville</p>
        </div>
      )}

      {/* ── Results ───────────────────────── */}
      {!loading && hasResults && (
        <div className="px-4 pt-4">

          {/* Restaurants */}
          {tab === 'restaurants' && (
            <div className="flex flex-col gap-2">
              {restaurants.map(r => {
                const seed = r.id.replace(/-/g, '').slice(0, 8)
                const color = r.michelin_stars >= 3 ? '#E4002B' : r.michelin_stars === 2 ? '#f97316' : '#facc15'
                return (
                  <Link
                    key={r.id}
                    href={`/restaurant/${r.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900 border border-white/5 active:bg-neutral-800 transition-colors"
                  >
                    {/* thumbnail */}
                    <div
                      className="w-14 h-14 rounded-xl bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/100/100)` }}
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
                    {r.michelin_stars > 0 && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: color + '20', border: `1.5px solid ${color}` }}
                      >
                        <span style={{ color, fontSize: 10, fontWeight: 900 }}>{'★'.repeat(r.michelin_stars)}</span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )}

          {/* Users */}
          {tab === 'users' && (
            <div className="flex flex-col gap-2">
              {users.map(u => {
                const avatarUrl = u.avatar_url ?? `https://picsum.photos/seed/${u.username}/100/100`
                return (
                  <Link
                    key={u.id}
                    href={`/chef/${u.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-neutral-900 border border-white/5 active:bg-neutral-800 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-neutral-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-sm">@{u.username}</p>
                      <p className="text-white/30 text-xs capitalize mt-0.5">{u.role === 'chef' ? '👨‍🍳 Chef' : '🍽 Gastronome'}</p>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-4 h-4 opacity-20 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )
              })}
            </div>
          )}

        </div>
      )}

      <BottomNav />
    </div>
  )
}
