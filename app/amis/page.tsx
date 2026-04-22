'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'

type Ami = {
  followee_id: string
  users: { id: string; username: string; avatar_url: string | null } | null
}

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


export default function AmisPage() {
  return (
    <Suspense>
      <AmisContent />
    </Suspense>
  )
}

function AmisContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tab, setTab] = useState<'amis' | 'decouvrir'>(
    (searchParams.get('tab') as 'amis' | 'decouvrir') ?? 'amis'
  )
  const [showAuthGate, setShowAuthGate] = useState(false)

  // Amis state
  const [amis, setAmis] = useState<Ami[]>([])
  const [loadingAmis, setLoadingAmis] = useState(false)

  // Découvrir / search state
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)

  // Fetch amis (following) when session ready
  useEffect(() => {
    if (!session?.user?.id) return
    setLoadingAmis(true)
    fetch(`/api/users/${session.user.id}/following`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : []
        // Supabase returns users as array on joins — normalize
        setAmis(list.map((item: { followee_id: string; users: Ami['users'] | Ami['users'][] }) => ({
          followee_id: item.followee_id,
          users: Array.isArray(item.users) ? (item.users[0] ?? null) : item.users,
        })))
      })
      .finally(() => setLoadingAmis(false))
  }, [session?.user?.id])


  // Sync tab + query to URL (replace, pas push — pas de nouvelle entrée historique)
  useEffect(() => {
    const params = new URLSearchParams()
    if (tab !== 'amis') params.set('tab', tab)
    if (query) params.set('q', query)
    const qs = params.toString()
    router.replace(qs ? `/amis?${qs}` : '/amis', { scroll: false })
  }, [tab, query, router])

  // Focus input when switching to découvrir
  useEffect(() => {
    if (tab === 'decouvrir') setTimeout(() => inputRef.current?.focus(), 150)
  }, [tab])

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setRestaurants([]); setUsers([]); return }
    setLoadingSearch(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setRestaurants(data.restaurants ?? [])
      setUsers(data.users ?? [])
    } finally {
      setLoadingSearch(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => search(query), 250)
    return () => clearTimeout(t)
  }, [query, search])

  const isSearching = query.trim().length > 0
  const hasResults = restaurants.length > 0 || users.length > 0

  return (
    <div className="flex flex-col bg-black min-h-dvh pb-24">

      {/* ── Header ───────────────────────────── */}
      <div className="px-4 pt-14 pb-0">
        <h1 className="text-2xl font-black text-white mb-4">Communauté</h1>
        <div className="flex gap-0 bg-white/5 rounded-2xl p-1 mb-5">
          {([
            { key: 'amis', label: '👥 Amis' },
            { key: 'decouvrir', label: '🔍 Découvrir' },
          ] as const).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === key ? 'bg-white text-black' : 'text-white/50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab: Amis ────────────────────────── */}
      {tab === 'amis' && (
        <div className="px-4 flex flex-col gap-3">
          {!session ? (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center mt-8">
              <span className="text-4xl">👥</span>
              <div>
                <p className="text-white font-semibold mb-1">Tes amis apparaissent ici</p>
                <p className="text-white/40 text-sm">Connecte-toi pour voir les gens que tu suis.</p>
              </div>
              <button
                onClick={() => setShowAuthGate(true)}
                className="px-6 py-2.5 rounded-full text-white text-sm font-semibold"
                style={{ background: '#E4002B' }}
              >
                Se connecter
              </button>
            </div>
          ) : loadingAmis ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse" />
            ))
          ) : amis.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="text-4xl">🍽</span>
              <p className="text-white font-semibold">Tu ne suis personne encore</p>
              <p className="text-white/40 text-sm">Utilise l&apos;onglet Découvrir pour trouver des gens à suivre.</p>
              <button
                onClick={() => setTab('decouvrir')}
                className="mt-2 px-5 py-2 rounded-full text-white text-xs font-bold"
                style={{ background: '#E4002B' }}
              >
                Découvrir
              </button>
            </div>
          ) : (
            amis.map((ami) => {
              const u = ami.users
              if (!u) return null
              const avatarUrl = u.avatar_url ?? `https://picsum.photos/seed/${u.username}/100/100`
              return (
                <Link
                  key={ami.followee_id}
                  href={`/chef/${ami.followee_id}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 active:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-neutral-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">@{u.username}</p>
                  </div>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-4 h-4 opacity-20 flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )
            })
          )}
        </div>
      )}

      {/* ── Tab: Découvrir ───────────────────── */}
      {tab === 'decouvrir' && (
        <div className="flex flex-col flex-1 px-4">

          {/* Search bar */}
          <div className="flex items-center gap-2 bg-neutral-900 rounded-2xl px-4 py-3 border border-white/5 mb-4">
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

          {/* Empty state */}
          {!isSearching && (
            <div className="flex flex-col items-center pt-16 text-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1} className="w-12 h-12 opacity-10 mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <p className="text-white/20 text-sm">Tape un nom pour rechercher</p>
            </div>
          )}

          {/* Loading */}
          {loadingSearch && (
            <div className="flex justify-center pt-10">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}

          {/* No results */}
          {!loadingSearch && isSearching && !hasResults && (
            <div className="flex flex-col items-center pt-16 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="text-white font-bold text-sm mb-1">Aucun résultat</p>
              <p className="text-white/30 text-xs">Essaie un autre nom ou une ville</p>
            </div>
          )}

          {/* Results — grille 2 colonnes */}
          {!loadingSearch && isSearching && hasResults && (
            <div className="grid grid-cols-2 gap-2">
              {restaurants.map(r => {
                const seed = r.id.replace(/-/g, '').slice(0, 8)
                const starColor = r.michelin_stars >= 3 ? '#E4002B' : r.michelin_stars === 2 ? '#f97316' : '#facc15'
                return (
                  <Link key={`r-${r.id}`} href={`/restaurant/${r.id}`} className="relative rounded-2xl overflow-hidden bg-neutral-900 aspect-square active:scale-[0.97] transition-transform">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/300/300)` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    {r.michelin_stars > 0 && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full text-white text-[9px] font-black" style={{ background: starColor }}>
                        {'★'.repeat(r.michelin_stars)}
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <p className="text-white font-black text-xs leading-tight line-clamp-2">{r.name}</p>
                      <p className="text-white/50 text-[10px] mt-0.5">{r.city}</p>
                    </div>
                  </Link>
                )
              })}
              {users.map(u => {
                const avatarUrl = u.avatar_url ?? `https://picsum.photos/seed/${u.username}/100/100`
                const isChef = u.role === 'chef'
                return (
                  <Link key={`u-${u.id}`} href={`/chef/${u.id}`} className="relative rounded-2xl overflow-hidden bg-neutral-900 aspect-square active:scale-[0.97] transition-transform">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${avatarUrl})` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    {isChef && (
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[9px] font-bold">
                        Chef
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-2.5">
                      <p className="text-white font-black text-xs leading-tight">@{u.username}</p>
                      <p className="text-white/50 text-[10px] mt-0.5">{isChef ? '👨‍🍳 Chef' : '🍽 Gastronome'}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
      <BottomNav />
    </div>
  )
}
