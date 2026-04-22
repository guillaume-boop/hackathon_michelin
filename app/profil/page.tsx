'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'

type UserProfile = {
  id: string
  username: string
  email: string
  avatar_url: string | null
  role: string
  circle_score: number
  created_at: string
}

type Experience = {
  id: string
  rating: number
  note: string | null
  visited_at: string
  restaurant_id: string
}

const navItems = [
  { href: '/', label: 'Pour toi', icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
  )},
  { href: '/', label: 'Explorer', icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )},
  { href: '/amis', label: 'Communauté', icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )},
  { href: '/map', label: 'Carte', icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )},
  { href: '/profil', label: 'Profil', active: true, icon: (active: boolean) => (
    <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )},
]

export default function ProfilPage() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'collections'>('posts')
  const [showMenuModal, setShowMenuModal] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return }
    Promise.all([
      fetch(`/api/users/${session.user.id}`).then(r => r.json()),
      fetch(`/api/experiences?user_id=${session.user.id}`).then(r => r.json()),
    ]).then(([user, exps]) => {
      setProfile(user)
      setExperiences(Array.isArray(exps) ? exps : [])
    }).finally(() => setLoading(false))
  }, [session])

  // Empêcher le scroll quand le modal est ouvert
  useEffect(() => {
    if (showMenuModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [showMenuModal])

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-white dark:bg-black gap-6 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-10 h-10 text-gray-400 dark:text-gray-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Mon profil</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Connecte-toi pour accéder à ton profil.</p>
        </div>
        <button
          onClick={() => setShowAuthGate(true)}
          className="px-8 py-3.5 rounded-xl text-white font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
          style={{ background: '#E4002B' }}
        >
          Se connecter
        </button>
        {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-white dark:bg-black">
      {/* Layout avec sidebar à gauche comme TikTok */}
      <div className="flex">
        {/* Sidebar gauche - Navigation (visible seulement sur desktop) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-[240px] xl:w-[260px] h-screen sticky top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
          {/* Logo */}
          <div className="px-4 py-5">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E4002B]">
                <img src="/icons/etoile-michelin.svg" alt="Michelin" className="w-4 h-4 brightness-0 invert" />
              </div>
              <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">MICHELIN</span>
            </Link>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive = item.href === '/' ? pathname === '/' : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive || item.active
                      ? 'bg-red-50 dark:bg-red-950/30 text-[#E4002B]' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900'
                  }`}
                >
                  {item.icon(isActive || item.active)}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Profil utilisateur en bas */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800">
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
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="flex-1 min-w-0">
          {/* Header desktop simplifié (sans sidebar) */}
          <div className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 bg-white/80 dark:bg-black/80 backdrop-blur-md">
            <div className="flex-1 max-w-xl mx-auto">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input type="text" placeholder="Rechercher un restaurant, un chef..." className="w-full pl-10 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:bg-white dark:focus:bg-gray-800 transition-colors" />
              </div>
            </div>
          </div>

          {/* Contenu du profil */}
          <div className="lg:max-w-4xl lg:mx-auto lg:px-8">
            {/* Header avec dégradé */}
            <div className="relative">
              <div className="h-32 bg-gradient-to-r from-red-500 to-red-700 dark:from-red-800 dark:to-red-950 bg-cover bg-center" style={{ backgroundImage: 'url(/images/image3.png)' }} />
              
              <div className="absolute -bottom-12 left-4 lg:left-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-black bg-gray-200 dark:bg-gray-700">
                {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-white" style={{ background: '#E4002B' }}>
                  {(profile?.username?.[0] ?? session.user?.name?.[0] ?? '?').toUpperCase()}
                </div>
                )}
              </div>
              </div>

              {/* Bouton menu à la place du bouton déconnexion */}
              <div className="absolute top-4 right-4 lg:right-0">
              <button
                onClick={() => setShowMenuModal(true)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white hover:bg-black/70 transition-all"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z" />
                </svg>
              </button>
              </div>
            </div>

            {/* Informations profil */}
            <div className="pt-14 px-4 lg:px-0 pb-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">@{profile?.username ?? session.user?.name}</h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">{session.user?.email}</p>
                </div>
                {profile?.role === 'chef' && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-red-100 dark:bg-red-900/30 text-[#E4002B]">
                    👨‍🍳 Chef
                  </span>
                )}
              </div>

              <p className="text-gray-600 dark:text-gray-400 text-sm mt-3">
                Passionné de gastronomie ✨
              </p>

              <div className="flex gap-6 mt-4">
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">{experiences.length}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Expériences</span>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">{profile?.circle_score ?? 0}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Circle Score</span>
                </div>
                <div className="text-center">
                  <span className="block text-lg font-bold text-gray-900 dark:text-white">
                    {profile?.created_at ? new Date(profile.created_at).getFullYear() : '—'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Membre</span>
                </div>
              </div>
            </div>

            {/* Onglets */}
            <div className="border-t border-gray-200 dark:border-gray-800 mt-2">
              <div className="flex">
                {[
                  { id: 'posts', label: 'Posts', icon: (active: boolean) => (
                    <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h2v12H3zm6 0h2v12H9zm6 0h2v12h-2zm6 0h2v12h-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6h20v1H2z" />
                    </svg>
                  )},
                  { id: 'likes', label: 'J\'aime', icon: (active: boolean) => (
                    <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                  )},
                  { id: 'collections', label: 'Collections', icon: (active: boolean) => (
                    <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
                    </svg>
                  )},
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                    className={`flex-1 py-3 text-sm font-semibold transition-all relative ${
                      activeTab === tab.id
                        ? 'text-[#E4002B]'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {tab.icon(activeTab === tab.id)}
                      <span>{tab.label}</span>
                    </span>
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E4002B] rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenu des onglets */}
            <div className="p-4 lg:p-0 lg:py-4">
              {activeTab === 'posts' && (
                <>
                  {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                      ))}
                    </div>
                  ) : experiences.length === 0 ? (
                    <div className="text-center py-16">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h2v12H3zm6 0h2v12H9zm6 0h2v12h-2zm6 0h2v12h-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6h20v1H2z" />
                      </svg>
                      <p className="text-gray-400 dark:text-gray-500 text-sm">Aucune expérience partagée</p>
                      <Link href="/feed" className="inline-block mt-4 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90" style={{ background: '#E4002B' }}>
                        Découvrir des restaurants
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-2">
                      {experiences.map(exp => (
                        <Link key={exp.id} href={`/restaurant/${exp.restaurant_id}`} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center text-4xl">
                            🍽️
                          </div>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-0.5 mb-1">
                                {Array.from({ length: exp.rating }).map((_, i) => (
                                  <svg key={i} viewBox="0 0 24 24" fill="#E4002B" className="w-3 h-3">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                  </svg>
                                ))}
                              </div>
                              {exp.note && <p className="text-white text-xs px-2 truncate max-w-full">{exp.note}</p>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === 'likes' && (
                <div className="text-center py-16">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Aucun like pour le moment</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Les vidéos que tu aimeras apparaîtront ici</p>
                </div>
              )}

              {activeTab === 'collections' && (
                <div className="text-center py-16">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
                  </svg>
                  <p className="text-gray-400 dark:text-gray-500 text-sm">Aucune collection</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Crée des collections pour organiser tes restaurants préférés</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal menu style TikTok */}
      {showMenuModal && (
        <div className="fixed inset-0 z-50 flex items-end  justify-center" onClick={() => setShowMenuModal(false)}>
          {/* Overlay avec animation */}
          <div 
            className="absolute inset-0 bg-black/60 transition-opacity duration-300"
            style={{ opacity: showMenuModal ? 1 : 0 }}
            onClick={() => setShowMenuModal(false)}
          />
          
          {/* Modal qui glisse du bas vers le haut */}
          <div 
            className="relative w-full max-w-md mx-4 mb-4 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-xl transform transition-all duration-300 animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Options du menu */}
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <button
                onClick={() => {
                  setShowMenuModal(false)
                  // Action pour modifier le profil
                }}
                className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-sm font-medium">Modifier le profil</span>
              </button>

              <button
                onClick={() => {
                  setShowMenuModal(false)
                  // Action pour les paramètres
                }}
                className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
                <span className="text-sm font-medium">Paramètres et confidentialité</span>
              </button>

              <button
                onClick={() => {
                  setShowMenuModal(false)
                  // Action pour l'aide
                }}
                className="w-full flex items-center gap-3 px-4 py-4 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0zm-9 5.25h.008v.008H12v-.008z" />
                </svg>
                <span className="text-sm font-medium">Aide</span>
              </button>

              <button
                onClick={() => {
                  setShowMenuModal(false)
                  signOut({ callbackUrl: '/login' })
                }}
                className="w-full flex items-center gap-3 px-4 py-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                </svg>
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>

            {/* Bouton annuler */}
            <button
              onClick={() => setShowMenuModal(false)}
              className="w-full py-4 text-center text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-800"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav mobile (visible seulement sur mobile) */}
      <div className="lg:hidden">
        <BottomNav />
      </div>

      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}