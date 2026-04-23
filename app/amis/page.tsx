'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef, useCallback, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
    <div className="flex h-screen bg-white dark:bg-black">

      {/* ─── SIDEBAR GAUCHE (lg+) ─── */}
      <aside className="hidden lg:flex flex-col w-52 xl:w-60 2xl:w-72 shrink-0 border-r border-gray-200 dark:border-gray-800 h-full overflow-y-auto bg-white dark:bg-black p-4 xl:p-6">
        {/* Logo */}
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-lg flex items-center justify-center bg-[#E4002B]">
              <span className="text-white font-black text-lg">M</span>
            </div>
            <span className="font-black text-base xl:text-lg tracking-tight text-gray-900 dark:text-white hidden xl:block">MICHELIN</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="space-y-1 flex-1">
          {[
            { 
              href: '/', 
              label: 'Pour toi', 
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.954c.44-.44 1.152-.44 1.592 0L21.75 12M4.5 10.5v6.75a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V10.5m-9 7.5v-4.5h3v4.5" />
                </svg>
              )            },
            { 
              href: '/amis', 
              label: 'Communauté', 
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
            },
            { 
              href: '/decouvrir', 
              label: 'Explorer', 
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>
            },
            { 
              href: '/map', 
              label: 'Carte', 
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
            )            },
            { 
              href: '/profil', 
              label: 'Profil', 
              icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>
            },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <span className="text-gray-500 dark:text-gray-500">{item.icon}</span>
              <span className="hidden xl:block">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile Summary */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          {session ? (
            <div className="flex flex-col gap-2">
              <Link href="/profil" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700 shrink-0 ring-2 ring-[#E4002B]/20">
                  {session.user?.image ? (
                    <Image src={session.user.image} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                      {session.user?.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 hidden xl:block">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{session.user?.name || 'Utilisateur'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                </div>
              </Link>
              <Link
                href="/profil"
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#E4002B] hover:opacity-90 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                Voir mon profil
              </Link>
            </div>
          ) : (
            <Link
              href="/login"
              className="w-full flex items-center justify-center py-2 px-3 rounded-lg text-sm font-bold text-white bg-[#E4002B] hover:opacity-90 transition-opacity"
            >
              Se connecter
            </Link>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col items-center h-full overflow-y-auto pb-24 lg:pb-0">
        
        {/* Conteneur centré avec max-w-4xl */}
        <div className="w-full max-w-4xl">
          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-30 px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <span className="font-black text-lg text-gray-900 dark:text-white">MICHELIN</span>
              <Link
                href="/profil"
                className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700 ring-2 ring-[#E4002B]/20"
              >
                {session?.user?.image ? (
                  <Image src={session.user.image} alt="Avatar" width={32} height={32} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                    {session?.user?.email?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
              </Link>
            </div>
          </div>

          {/* Header */}
          <div className="px-4 pt-14 lg:pt-6 pb-0">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Communauté</h1>
            <div className="flex gap-0 bg-gray-100 dark:bg-white/5 rounded-2xl p-1 mb-5">
              {([
                { key: 'amis', label: ' Amis' },
                { key: 'decouvrir', label: ' Découvrir' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    tab === key 
                      ? 'bg-white dark:bg-white text-gray-900 dark:text-black' 
                      : 'text-gray-500 dark:text-white/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab: Amis ── */}
          {tab === 'amis' && (
            <div className="px-4 flex flex-col gap-3">
              {!session ? (
                <div className="flex flex-col items-center justify-center gap-4 p-8 text-center mt-8">
                  <span className="text-4xl">👥</span>
                  <div>
                    <p className="text-gray-900 dark:text-white font-semibold mb-1">Tes amis apparaissent ici</p>
                    <p className="text-gray-500 dark:text-white/40 text-sm">Connecte-toi pour voir les gens que tu suis.</p>
                  </div>
                  <button
                    onClick={() => setShowAuthGate(true)}
                    className="px-6 py-2.5 rounded-full text-white text-sm font-semibold bg-[#E4002B]"
                  >
                    Se connecter
                  </button>
                </div>
              ) : loadingAmis ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                ))
              ) : amis.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <span className="text-4xl">🍽</span>
                  <p className="text-gray-900 dark:text-white font-semibold">Tu ne suis personne encore</p>
                  <p className="text-gray-500 dark:text-white/40 text-sm">Utilise l&apos;onglet Découvrir pour trouver des gens à suivre.</p>
                  <button
                    onClick={() => setTab('decouvrir')}
                    className="mt-2 px-5 py-2 rounded-full text-white text-xs font-bold bg-[#E4002B]"
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
                      className="flex items-center gap-3 p-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-300 dark:bg-neutral-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 dark:text-white font-bold text-sm">@{u.username}</p>
                      </div>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 opacity-20 flex-shrink-0 text-gray-900 dark:text-white">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                })
              )}
            </div>
          )}

          {/* ── Tab: Découvrir ── */}
          {tab === 'decouvrir' && (
            <div className="flex flex-col flex-1 px-4">

              {/* Search bar */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-neutral-900 rounded-2xl px-4 py-3 border border-gray-200 dark:border-white/5 mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 opacity-40 flex-shrink-0 text-gray-500 dark:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Restaurant, chef, ville…"
                  className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-white/30 outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="opacity-40">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-500 dark:text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Empty state */}
              {!isSearching && (
                <div className="flex flex-col items-center pt-16 text-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-12 h-12 opacity-10 mb-4 text-gray-400 dark:text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <p className="text-gray-400 dark:text-white/20 text-sm">Tape un nom pour rechercher</p>
                </div>
              )}

              {/* Loading */}
              {loadingSearch && (
                <div className="flex justify-center pt-10">
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-white/20 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                </div>
              )}

              {/* No results */}
              {!loadingSearch && isSearching && !hasResults && (
                <div className="flex flex-col items-center pt-20 text-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-12 h-12 opacity-30 mb-4 text-gray-400 dark:text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <p className="text-gray-900 dark:text-white font-bold text-sm mb-1">Aucun résultat</p>
                  <p className="text-gray-500 dark:text-white/30 text-xs">Essaie un autre nom ou une ville</p>
                </div>
              )}

              {/* Results — grille responsive (2 colonnes sur mobile, 3 sur desktop) */}
              {!loadingSearch && isSearching && hasResults && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                  {restaurants.map(r => {
                    const seed = r.id.replace(/-/g, '').slice(0, 8)
                    const starColor = r.michelin_stars >= 3 ? '#E4002B' : r.michelin_stars === 2 ? '#f97316' : '#facc15'
                    return (
                      <Link key={`r-${r.id}`} href={`/restaurant/${r.id}`} className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-900 aspect-square active:scale-[0.97] transition-transform">
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
                      <Link key={`u-${u.id}`} href={`/chef/${u.id}`} className="relative rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-900 aspect-square active:scale-[0.97] transition-transform">
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
        </div>
      </main>

      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
      <BottomNav />
    </div>
  )
}