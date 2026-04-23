'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
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
  
  // État pour le formulaire pas à pas
  const [step, setStep] = useState(1)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

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

  // Live search on query change
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

  // Debounced live search (query only)
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
    setIsFilterModalOpen(false)
    setStep(1)
  }

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1)
  }

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleOpenFilters = () => {
    setPendingFilters(filters)
    setStep(1)
    setIsFilterModalOpen(true)
  }

  const hasActiveFilters = filters.ville || filters.occasion || filters.cuisine || filters.budget < 500

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
              )
            },
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
              )
            },
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
      <main className="flex-1 flex flex-col items-center h-full overflow-y-auto pb-28 lg:pb-0">
        
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

          {/* Search bar */}
          <div className="sticky top-0 z-20 bg-white/95 dark:bg-black/95 backdrop-blur-xl px-4 pt-14 lg:pt-6 pb-4">
            <div className="flex items-center gap-3 bg-gray-100 dark:bg-neutral-900 rounded-2xl px-4 py-2">
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
              {query ? (
                <button onClick={() => setQuery('')} className="opacity-40 active:opacity-100">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-500 dark:text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={handleOpenFilters}
                  className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0 hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-gray-500 dark:text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                  </svg>
                </button>
              )}
            </div>
            
            {/* Afficher les filtres actifs */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3">
                {filters.ville && (
                  <span className="px-2 py-1 rounded-full bg-[#E4002B]/20 text-[#E4002B] text-xs">
                    📍 {filters.ville}
                  </span>
                )}
                {filters.occasion && (
                  <span className="px-2 py-1 rounded-full bg-[#E4002B]/20 text-[#E4002B] text-xs">
                    🎉 {filters.occasion}
                  </span>
                )}
                {filters.budget > 0 && (
                  <span className="px-2 py-1 rounded-full bg-[#E4002B]/20 text-[#E4002B] text-xs">
                    💰 {filters.budget}€
                  </span>
                )}
                {filters.cuisine && (
                  <span className="px-2 py-1 rounded-full bg-[#E4002B]/20 text-[#E4002B] text-xs">
                    🍽️ {filters.cuisine}
                  </span>
                )}
                <button
                  onClick={() => {
                    setFilters(DEFAULT_FILTERS)
                    setPendingFilters(DEFAULT_FILTERS)
                    search('', DEFAULT_FILTERS)
                  }}
                  className="px-2 py-1 rounded-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white/60 text-xs hover:bg-gray-300 dark:hover:bg-white/20 transition-colors"
                >
                  Effacer
                </button>
              </div>
            )}
          </div>

          {/* Live search results */}
          {isSearching && (
            <div className="px-4 pt-1">
              {loading && (
                <div className="flex justify-center pt-12">
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-white/20 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                </div>
              )}
              {!loading && !hasResults && (
                <div className="flex flex-col items-center pt-20 text-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-12 h-12 opacity-30 mb-4 text-gray-400 dark:text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                  </svg>
                  <p className="text-gray-900 dark:text-white font-bold text-sm mb-1">Aucun résultat</p>
                  <p className="text-gray-500 dark:text-white/30 text-xs">Essaie un autre nom ou une ville</p>
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
                      <SearchRow key={`${item.type}-${item.data.id}`} last={i === allItems.length - 1}>
                        {item.type === 'user'
                          ? <UserResult u={item.data as User} isFollowed={followingIds.has(item.data.id)} />
                          : <RestaurantResult r={item.data as Restaurant} />
                        }
                      </SearchRow>
                    ))
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Résultats des filtres */}
          {!isSearching && hasActiveFilters && (
            <div className="px-4 pt-2">
              {loading && (
                <div className="flex justify-center py-8">
                  <div className="w-5 h-5 border-2 border-gray-300 dark:border-white/20 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                </div>
              )}
              {!loading && restaurants.length === 0 && (
                <div className="flex flex-col items-center py-20 text-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-12 h-12 opacity-30 mb-4 text-gray-400 dark:text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-4.5-4.5M6.75 19.5L3 15.75m3.75 3.75l4.5-4.5m-4.5 4.5L3 15.75m18 0l-4.5 4.5" />
                  </svg>
                  <p className="text-gray-900 dark:text-white font-bold text-sm mb-1">Aucun restaurant trouvé</p>
                  <p className="text-gray-500 dark:text-white/30 text-xs">Ajuste tes critères pour voir plus de résultats</p>
                </div>
              )}
              {!loading && restaurants.map(r => <RestaurantResult key={r.id} r={r} />)}
            </div>
          )}

          {/* État par défaut */}
          {!isSearching && !hasActiveFilters && (
            <div className="flex flex-col items-center pt-20 text-center px-4">
              <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-10 h-10 opacity-30 text-gray-400 dark:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
              </div>
              <p className="text-gray-900 dark:text-white font-bold text-lg mb-2">Affiner votre recherche</p>
              <p className="text-gray-500 dark:text-white/40 text-sm max-w-md">
                Utilisez le bouton filtre pour trouver le restaurant parfait selon vos critères
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Filtres pas à pas */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/80 backdrop-blur-sm" onClick={() => setIsFilterModalOpen(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-3xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-2">
                <button onClick={() => setIsFilterModalOpen(false)} className="text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Progress bar */}
              <div className="flex gap-1 mt-4">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 h-1 rounded-full transition-all ${
                      s <= step ? 'bg-[#E4002B]' : 'bg-gray-200 dark:bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step content */}
            <div className="p-6">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Dans quelle ville ?</h3>
                  </div>
                  <input
                    type="text"
                    value={pendingFilters.ville}
                    onChange={e => setPendingFilters(f => ({ ...f, ville: e.target.value }))}
                    placeholder="Ex: Paris, Lyon, Bordeaux..."
                    className="w-full bg-gray-100 dark:bg-white/5 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#E4002B] transition-colors"
                    autoFocus
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <span className="text-5xl mb-2 block">🎉</span>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quelle est loccasion ?</h3>
                    <p className="text-gray-500 dark:text-white/40 text-sm mt-1">Pour quel événement ?</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                   {['Dîner en couple', 'Affaires', 'Entre amis', 'Famille', 'Célébration', 'Découverte'].map((occ) => (
                      <button
                        key={occ}
                        onClick={() => setPendingFilters(f => ({ ...f, occasion: occ }))}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          pendingFilters.occasion === occ
                            ? 'bg-[#E4002B] text-white'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {occ}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={pendingFilters.occasion}
                    onChange={e => setPendingFilters(f => ({ ...f, occasion: e.target.value }))}
                    placeholder="Ou personnalisez..."
                    className="w-full bg-gray-100 dark:bg-white/5 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#E4002B] transition-colors"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quel est votre budget ?</h3>
                    <p className="text-gray-500 dark:text-white/40 text-sm mt-1">Par personne (en euros)</p>
                  </div>
                  <div>
                    <input
                      type="range"
                      min={0}
                      max={500}
                      step={25}
                      value={pendingFilters.budget}
                      onChange={e => setPendingFilters(f => ({ ...f, budget: Number(e.target.value) }))}
                      className="w-full accent-[#E4002B]"
                    />
                    <div className="flex justify-between mt-3">
                      <span className="text-gray-500 dark:text-white/40 text-xs">0€</span>
                      <span className="text-gray-900 dark:text-white font-bold text-lg">
                        {pendingFilters.budget === 0 ? 'Illimité' : pendingFilters.budget >= 500 ? '500€+' : `${pendingFilters.budget}€`}
                      </span>
                      <span className="text-gray-500 dark:text-white/40 text-xs">500€+</span>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Que souhaitez-vous manger ?</h3>
                    <p className="text-gray-500 dark:text-white/40 text-sm mt-1">Type de cuisine ou plat préféré</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['Française', 'Italienne', 'Japonaise', 'Chinoise', 'Mexicaine', 'Végétarien'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setPendingFilters(f => ({ ...f, cuisine: type }))}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          pendingFilters.cuisine === type
                            ? 'bg-[#E4002B] text-white'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white/70 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={pendingFilters.cuisine}
                    onChange={e => setPendingFilters(f => ({ ...f, cuisine: e.target.value }))}
                    placeholder="Ou personnalisez..."
                    className="w-full bg-gray-100 dark:bg-white/5 rounded-xl px-4 py-2.5 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-white/20 outline-none focus:ring-2 focus:ring-[#E4002B] transition-colors"
                  />
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div className="p-6 border-t border-gray-200 dark:border-white/10 flex gap-3">
              {step > 1 && (
                <button
                  onClick={handlePrevStep}
                  className="flex-1 py-3 rounded-xl text-gray-900 dark:text-white font-semibold bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  Retour
                </button>
              )}
              {step < 4 ? (
                <button
                  onClick={handleNextStep}
                  className="flex-1 py-3 rounded-xl text-white font-semibold bg-[#E4002B] hover:opacity-90 transition-opacity"
                >
                  Suivant
                </button>
              ) : (
                <button
                  onClick={handleValider}
                  className="flex-1 py-3 rounded-xl text-white font-semibold bg-[#E4002B] hover:opacity-90 transition-opacity"
                >
                  Voir les résultats
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SearchRow({ children, last }: { children: React.ReactNode; last: boolean }) {
  return (
    <div className={`active:bg-gray-100 dark:active:bg-white/5 transition-colors ${!last ? 'border-b border-gray-200 dark:border-white/[0.05]' : ''}`}>
      {children}
    </div>
  )
}

function RestaurantResult({ r }: { r: Restaurant }) {
  const seed = r.id.replace(/-/g, '').slice(0, 8)
  return (
    <Link href={`/restaurant/${r.id}`} className="flex items-center gap-3 py-3">
      <div
        className="w-12 h-12 rounded-xl bg-cover bg-center flex-shrink-0"
        style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/120/120)` }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">{r.name}</p>
        <p className="text-gray-500 dark:text-white/30 text-xs mt-0.5 truncate">
          <span className="text-gray-400 dark:text-white/25">Restaurant · </span>{r.city}
        </p>
        {(r.michelin_stars > 0 || r.green_stars) && (
          <div className="flex items-center gap-0.5 mt-1">
            {Array.from({ length: r.michelin_stars }).map((_, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={index} src="/icons/etoile-michelin.svg" alt="" className="w-3 h-3"
                style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(97%) saturate(7471%) hue-rotate(340deg) brightness(97%) contrast(109%)' }}
              />
            ))}
            {r.green_stars && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/icons/etoile-michelin.svg" alt="" className="w-3 h-3"
                style={{ filter: 'brightness(0) saturate(100%) invert(48%) sepia(79%) saturate(476%) hue-rotate(86deg) brightness(95%) contrast(92%)' }}
              />
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

function UserResult({ u, isFollowed }: { u: User; isFollowed: boolean }) {
  const avatarUrl = u.avatar_url ?? `https://picsum.photos/seed/${u.username}/100/100`
  const label = u.role === 'chef' ? 'Chef' : u.role === 'inspecteur' ? 'Inspecteur' : 'Gastronome'
  return (
    <Link href={`/user/${u.id}`} className="flex items-center gap-3 py-3">
      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-neutral-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">@{u.username}</p>
          {isFollowed && <FollowedBadge />}
        </div>
        <p className="text-gray-500 dark:text-white/25 text-xs mt-0.5">{label}</p>
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