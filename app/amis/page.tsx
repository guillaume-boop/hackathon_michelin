'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'
import Stars from '@/components/ui/Stars'

type Chef = {
  id: string
  bio: string | null
  video_url: string | null
  users: { id: string; username: string; avatar_url: string | null }
  restaurants: { id: string; name: string; city: string; michelin_stars: number; green_stars: boolean }
}

type FriendLocation = {
  user_id: string
  lat: number
  lng: number
  updated_at: string
  users?: { username: string; avatar_url: string | null }
  restaurant?: { name: string; city: string }
}

const CITY_PINS = [
  { city: 'Paris', country: 'FR', x: 48, y: 32 },
  { city: 'Tokyo', country: 'JP', x: 80, y: 38 },
  { city: 'New York', country: 'US', x: 22, y: 37 },
  { city: 'London', country: 'GB', x: 46, y: 29 },
  { city: 'Copenhague', country: 'DK', x: 50, y: 26 },
  { city: 'Barcelona', country: 'ES', x: 47, y: 36 },
  { city: 'Menton', country: 'FR', x: 49, y: 36 },
]

// Navigation items pour la sidebar
const navItems = [
  { href: '/', label: 'Pour toi', icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
  )},
  { href: '/explore', label: 'Explorer', icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )},
  { href: '/following', label: 'Abonnements', icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )},
  { href: '/liked', label: 'J\'aime', icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )},
  { href: '/profil', label: 'Profil', icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )},
]

export default function AmisPage() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [tab, setTab] = useState<'discover' | 'map'>('discover')
  const [chefs, setChefs] = useState<Chef[]>([])
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [showAuthGate, setShowAuthGate] = useState(false)

  useEffect(() => {
    fetch('/api/chefs')
      .then(r => r.json())
      .then(d => setChefs(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))

    if (session) {
      fetch('/api/map/friends')
        .then(r => r.json())
        .then(d => setFriendLocations(Array.isArray(d) ? d : []))
    }
  }, [session])

  const handleFollow = async (userId: string) => {
    if (!session) { setShowAuthGate(true); return }
    const isFollowing = following.has(userId)
    setFollowing(prev => {
      const next = new Set(prev)
      if (isFollowing) next.delete(userId)
      else next.add(userId)
      return next
    })
    await fetch(`/api/users/${userId}/follow`, {
      method: isFollowing ? 'DELETE' : 'POST',
    })
  }

  return (
    <div className="min-h-dvh bg-white dark:bg-black">
      <div className="flex">
        {/* Sidebar gauche - Navigation (visible seulement sur desktop) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-[240px] xl:w-[260px] h-screen sticky top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          <div className="px-4 py-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E4002B]">
                <img src="/icons/etoile-michelin.svg" alt="Michelin" className="w-4 h-4 brightness-0 invert" />
              </div>
              <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">MICHELIN</span>
            </Link>
          </div>

          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-red-50 dark:bg-red-950/30 text-[#E4002B]' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  {item.icon(isActive)}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
            {session ? (
              <Link href="/profil" className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 shrink-0 ring-2 ring-[#E4002B]/20">
                  {session.user?.image ? (
                    <Image src={session.user.image} alt="Avatar" width={36} height={36} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-400">
                      {session.user?.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{session.user?.name || 'Utilisateur'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{session.user?.email}</p>
                </div>
              </Link>
            ) : (
              <Link
                href="/login"
                className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-bold text-white bg-[#E4002B] hover:opacity-90 transition-opacity"
              >
                Se connecter
              </Link>
            )}
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 min-w-0">
          {/* Header desktop avec recherche */}
          <div className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-md">
            <div className="flex-1 max-w-xl mx-auto">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input type="text" placeholder="Rechercher un chef, un restaurant..." className="w-full pl-10 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:bg-white dark:focus:bg-gray-800 transition-colors" />
              </div>
            </div>
          </div>

          {/* Contenu de la page communauté */}
          <div className="lg:max-w-4xl lg:mx-auto lg:px-8">
            <div className="px-4 pt-4 pb-20">
              {/* Header mobile */}
              <div className="lg:hidden mb-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Communauté</h1>
              </div>

              {/* Tab switcher */}
              <div className="flex gap-0 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-5">
                {(['discover', 'map'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                      tab === t 
                        ? 'bg-white dark:bg-gray-900 text-[#E4002B] shadow-sm' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {t === 'discover' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0l-4.725 2.885a.562.562 0 0 1-.84-.61l1.285-5.385a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                    )}
                    <span>{t === 'discover' ? 'Découvrir' : 'Map amis'}</span>
                  </button>
                ))}
              </div>

              {tab === 'discover' ? (
                <>
                  <p className="text-gray-400 dark:text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">
                    Chefs & Food lovers
                  </p>

                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="h-20 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse mb-3" />
                    ))
                  ) : chefs.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-gray-400 dark:text-gray-500 text-sm">Lance le script de seed pour voir des profils.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {chefs.map(chef => (
                        <div
                          key={chef.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-[#E4002B]/30 transition-all duration-300"
                        >
                          <Link href={`/chef/${chef.id}`} className="shrink-0">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                              {chef.users?.avatar_url ? (
                                <img src={chef.users.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-base font-bold text-white" style={{ background: '#E4002B' }}>
                                  {(chef.users?.username?.[0] ?? '?').toUpperCase()}
                                </div>
                              )}
                            </div>
                          </Link>

                          <div className="flex-1 min-w-0">
                            <Link href={`/chef/${chef.id}`}>
                              <p className="text-gray-900 dark:text-white font-semibold text-sm truncate">@{chef.users?.username}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{chef.restaurants?.name}</p>
                                <Stars count={chef.restaurants?.michelin_stars ?? 0} green={chef.restaurants?.green_stars} />
                              </div>
                              {chef.bio && (
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-1 line-clamp-1">{chef.bio}</p>
                              )}
                            </Link>
                          </div>

                          <button
                            onClick={() => handleFollow(chef.users?.id)}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                              following.has(chef.users?.id)
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                : 'text-white'
                            }`}
                            style={following.has(chef.users?.id) ? {} : { background: '#E4002B' }}
                          >
                            {following.has(chef.users?.id) ? 'Suivi' : 'Suivre'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  {!session ? (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center gap-4 p-8 text-center bg-gray-50 dark:bg-gray-900">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-12 h-12 text-gray-400 dark:text-gray-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                      </svg>
                      <div>
                        <p className="text-gray-900 dark:text-white font-semibold mb-1">Où mangent tes amis ?</p>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">Connecte-toi pour voir la map en temps réel.</p>
                      </div>
                      <button
                        onClick={() => setShowAuthGate(true)}
                        className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                        style={{ background: '#E4002B' }}
                      >
                        Se connecter
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Stylized world map */}
                      <div
                        className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800"
                        style={{ height: '300px', background: 'linear-gradient(135deg, #e8f4f8, #d4e8f0)' }}
                      >
                        {/* Grid lines */}
                        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                          {[20, 40, 60, 80].map(x => (
                            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="#333" strokeWidth="0.3" />
                          ))}
                          {[25, 50, 75].map(y => (
                            <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#333" strokeWidth="0.3" />
                          ))}
                        </svg>

                        {/* City pins */}
                        {CITY_PINS.map(pin => (
                          <div
                            key={pin.city}
                            className="absolute flex flex-col items-center"
                            style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -50%)' }}
                          >
                            <div className="w-2 h-2 rounded-full bg-gray-500 shadow-lg" />
                            <span className="text-gray-500 text-[8px] mt-0.5 whitespace-nowrap">{pin.city}</span>
                          </div>
                        ))}

                        {/* Friend location pins */}
                        {friendLocations.slice(0, 5).map((loc, i) => {
                          const xPct = ((loc.lng + 180) / 360) * 100
                          const yPct = ((90 - loc.lat) / 180) * 100
                          return (
                            <div
                              key={loc.user_id}
                              className="absolute flex items-center justify-center"
                              style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -50%)' }}
                            >
                              <div
                                className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-lg flex items-center justify-center text-white text-xs font-bold"
                                style={{ background: '#E4002B' }}
                              >
                                {loc.users?.username?.[0]?.toUpperCase() || '?'}
                              </div>
                            </div>
                          )
                        })}

                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                          <span className="text-gray-500 text-[10px] uppercase tracking-widest font-semibold">Live map</span>
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-gray-500 text-[10px]">{friendLocations.length} amis en ligne</span>
                          </div>
                        </div>
                      </div>

                      {/* Friend list */}
                      {friendLocations.length === 0 ? (
                        <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">Aucun ami en ligne pour le moment.</p>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {friendLocations.map(loc => (
                            <div key={loc.user_id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: '#E4002B' }}>
                                {(loc.users?.username?.[0] ?? '?').toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="text-gray-900 dark:text-white text-sm font-medium">@{loc.users?.username}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">{loc.restaurant?.name ?? `${loc.lat.toFixed(1)}, ${loc.lng.toFixed(1)}`}</p>
                              </div>
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-gray-400 dark:text-gray-500 text-[10px]">En ligne</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
      
      {/* Bottom nav mobile */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  )
}