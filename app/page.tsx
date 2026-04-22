'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import VideoCard from '@/components/feed/VideoCard'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'

type Post = {
  id: string
  user_id: string
  restaurant_id: string
  type: string
  content_url: string | null
  likes_count: number
  created_at: string
  users: { id: string; username: string; avatar_url: string | null }
  restaurants: { id: string; name: string; city: string; michelin_stars: number; green_stars: boolean }
}

export default function FeedPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [muted, setMuted] = useState(true)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/feed?limit=30')
      const data = await res.json()
      setPosts(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchFeed() }, [fetchFeed])

  const filteredPosts = filter === null
    ? posts
    : filter === -1
      ? posts.filter(p => p.restaurants?.green_stars)
      : posts.filter(p => p.restaurants?.michelin_stars === filter)

  const handleLike = useCallback(async (postId: string) => {
    if (!session) { setShowAuthGate(true); return }
    const res = await fetch(`/api/feed/posts/${postId}/like`, { method: 'POST' })
    if (res.ok) {
      setPosts(prev => prev.map(p =>
        p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
      ))
    }
  }, [session])

  useEffect(() => {
    const container = containerRef.current
    if (!container || filteredPosts.length === 0) return
    let timeoutId: NodeJS.Timeout
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        const newIndex = Math.round(container.scrollTop / container.clientHeight)
        if (newIndex !== activeIndex && newIndex >= 0 && newIndex < filteredPosts.length) {
          setActiveIndex(newIndex)
        }
      }, 50)
    }
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => { container.removeEventListener('scroll', handleScroll); clearTimeout(timeoutId) }
  }, [filteredPosts.length, activeIndex])

  useEffect(() => {
    setActiveIndex(0)
    if (containerRef.current) containerRef.current.scrollTop = 0
  }, [filter])

  const currentPost = filteredPosts[activeIndex]

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-black overflow-hidden">

      {/* ─── SIDEBAR GAUCHE ─── */}
      <aside className="hidden lg:flex shadow-lg flex-col w-[240px] xl:w-[260px] shrink-0 border-r border-gray-100 dark:border-gray-800 h-full overflow-y-auto bg-white dark:bg-black">
        {/* Logo */}
        <div className="px-6 py-5">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E4002B]">
              <Image src="/icons/etoile-michelin.svg" alt="Michelin" width={16} height={16} className="w-4 h-4 brightness-0 invert" />
            </div>
          </Link>
        </div>

        {/* Navigation principale */}
        <nav className="px-3 space-y-0.5">
          {[
            { href: '/', label: 'Pour toi', active: true, icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" /><path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" /></svg> },
            { href: '/amis', label: 'Communauté', active: false, icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> },
            { href: '/', label: 'Explorer', active: false, icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg> },
            { href: '/map', label: "Carte", active: false, icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg> },
            { href: '/profil', label: 'Profil', active: false, icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg> },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                item.active 
                  ? 'bg-red-50 dark:bg-red-950/30 text-[#E4002B]' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900'
              }`}
            >
              <span className={item.active ? 'text-[#E4002B]' : 'text-gray-400 dark:text-gray-500'}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Profil utilisateur */}
        <div className="mt-auto p-4 border-t border-gray-100 dark:border-gray-800">
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
            <div className="space-y-2">
              <Link
                href="/login"
                className="w-full flex items-center justify-center py-2.5 rounded-xl text-sm font-bold text-white bg-[#E4002B] hover:opacity-90 transition-opacity"
              >
                Se connecter
              </Link>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">Pour liker, commenter et suivre</p>
            </div>
          )}
        </div>
      </aside>

      {/* ─── FEED CENTRAL ─── */}
      <main className="flex-1 flex flex-col min-w-0 h-full">

        {/* Header mobile transparent avec icônes arrondies */}
        <div className="lg:hidden fixed top-5 left-0 right-0 z-30 px-4 py-3 bg-transparent">
          <div className="flex items-center justify-between">
            <span className="font-black text-lg tracking-tight text-white drop-shadow-lg">MICHELIN</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilterModal(true)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
              </button>
              <Link
                href="/search"
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
              </Link>
              <button
                onClick={() => setMuted(m => !m)}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all flex items-center justify-center"
              >
                {muted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal filtres mobile */}
        {showFilterModal && (
          <div className="lg:hidden fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-end justify-center" onClick={() => setShowFilterModal(false)}>
            <div className="bg-white dark:bg-gray-900 rounded-t-2xl w-full max-w-md p-4 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-3">Filtrer par</h3>
              <div className="space-y-2">
                {[
                  { val: null, label: 'Tous les restaurants' },
                  { val: 1, label: '1 étoile Michelin', icon: '/icons/etoile-michelin.svg' },
                  { val: 2, label: '2 étoiles Michelin', icon: '/icons/etoile-michelin.svg' },
                  { val: 3, label: '3 étoiles Michelin', icon: '/icons/etoile-michelin.svg' },
                  { val: -1, label: '🌿 Green Star' },
                ].map(f => (
                  <button
                    key={String(f.val)}
                    onClick={() => {
                      setFilter(f.val)
                      setShowFilterModal(false)
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2 ${
                      filter === f.val
                        ? f.val === -1 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                          : 'bg-red-100 dark:bg-red-900/30 text-[#E4002B]'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {f.icon && f.val !== -1 && (
                      <div className="flex items-center gap-0.5">
                        {[...Array(f.val)].map((_, i) => (
                          <Image key={i} src={f.icon!} alt="étoile Michelin" width={20} height={20} className="w-5 h-5" />
                        ))}
                      </div>
                    )}
                    {f.val === -1 && f.icon}
                    <span>{f.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Header desktop avec logo, recherche et connexion */}
        <div className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 bg-white dark:bg-black">
          {/* Barre de recherche au centre */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher un restaurant, un chef..."
                className="w-full pl-10 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-4 py-3 bg-gray-200 dark:bg-gray-900 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:bg-white dark:focus:bg-gray-800 transition-colors"
              />
            </div>
          </div>

          {/* Boutons à droite */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMuted(m => !m)}
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {muted ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-600 dark:text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-600 dark:text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                </svg>
              )}
            </button>

            {session ? (
              <Link
                href="/profil"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                  {session.user?.image ? (
                    <Image src={session.user.image} alt="Avatar" width={24} height={24} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                      {session.user?.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Profil</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2 rounded-full text-sm font-bold text-white bg-[#E4002B] hover:opacity-90 transition-opacity"
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>

        {/* Snap-scroll video feed */}
        <div className="flex-1 flex items-center justify-center relative overflow-hidden">
          <div
            ref={containerRef}
            className="h-full w-full lg:max-w-sm mx-auto overflow-y-scroll snap-y snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-2 border-gray-300 dark:border-gray-700 border-t-[#E4002B] rounded-full animate-spin" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
                <span className="text-6xl">🍽️</span>
                <p className="text-gray-500 dark:text-gray-400">Aucun contenu pour cette sélection.</p>
              </div>
            ) : (
              filteredPosts.map((post, i) => (
                <div key={post.id} className="snap-start snap-always h-full w-full">
                  <VideoCard
                    post={post}
                    isActive={i === activeIndex}
                    onLike={handleLike}
                    onAuthRequired={() => setShowAuthGate(true)}
                    sessionUserId={session?.user?.id}
                    muted={muted}
                  />
                </div>
              ))
            )}
          </div>

          {/* Dots de pagination */}
          {filteredPosts.length > 1 && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10 pointer-events-none">
              {filteredPosts.slice(Math.max(0, activeIndex - 3), activeIndex + 4).map((_, idx) => {
                const realIdx = Math.max(0, activeIndex - 3) + idx
                return (
                  <div
                    key={realIdx}
                    className={`rounded-full transition-all duration-300 ${
                      realIdx === activeIndex ? 'w-1.5 h-4 bg-white' : 'w-1.5 h-1.5 bg-white/30'
                    }`}
                  />
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* ─── SIDEBAR DROITE ─── */}
      <aside className="hidden shadow-lg xl:flex flex-col w-[300px] shrink-0 border-l border-gray-100 dark:border-gray-800 h-full overflow-y-auto bg-white dark:bg-black">
        {currentPost && (
          <div className="p-5 border-b border-gray-100 dark:border-gray-800">
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">En cours de lecture</p>

            {/* Thumbnail */}
            <div className="w-full aspect-[9/16] max-h-52 rounded-xl overflow-hidden bg-gray-900 mb-4 relative">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `url(https://picsum.photos/seed/${currentPost.id.replace(/-/g, '').slice(0, 8)}/300/530)`
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-white text-xs font-bold truncate">{currentPost.restaurants?.name}</p>
                <p className="text-white/60 text-[10px]">{currentPost.restaurants?.city}</p>
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-[#E4002B] rounded-full px-1.5 py-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-[9px] font-bold">LIVE</span>
              </div>
            </div>

            <h3 className="font-black text-gray-900 dark:text-white text-base">{currentPost.restaurants?.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5 mb-3">{currentPost.restaurants?.city}</p>

            <div className="flex items-center gap-3 flex-wrap mb-4">
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="#E4002B" className="w-4 h-4">
                  <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                </svg>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{currentPost.likes_count}</span>
              </div>
              
              {currentPost.restaurants?.michelin_stars > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    {[...Array(currentPost.restaurants.michelin_stars)].map((_, i) => (
                      <Image
                        key={i}
                        src="/icons/etoile-michelin.svg"
                        alt="étoile Michelin"
                        width={16}
                        height={16}
                        className="w-4 h-4"
                      />
                    ))}
                  </div>
                  <span className="text-sm text-amber-500 font-semibold">Michelin</span>
                </div>
              )}
              
              {currentPost.restaurants?.green_stars && (
                <span className="text-sm text-green-600 dark:text-green-500 font-semibold">🌿 Green</span>
              )}
            </div>

            <Link
              href={`/restaurant/${currentPost.restaurant_id}`}
              className="flex w-full items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white bg-[#E4002B] hover:opacity-90 transition-opacity"
            >
              Voir le restaurant
            </Link>
          </div>
        )}
      </aside>

      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}

      {/* Bottom nav mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
        <BottomNav />
      </div>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}