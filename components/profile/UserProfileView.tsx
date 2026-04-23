'use client'

import { useState, useEffect, useRef } from 'react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/layout/BottomNav'
import Stars from '@/components/ui/Stars'
import CircleScore from '@/components/ui/CircleScore'

// ── Types ─────────────────────────────────────────────────────────────────────

type UserProfile = {
  id: string
  username: string
  avatar_url: string | null
  role: string
  circle_score: number
}

type ChefData = {
  id: string
  bio: string | null
  video_url: string | null
  user_id: string
  restaurants: { id: string; name: string; city: string; country: string; michelin_stars: number; green_stars: boolean } | null
  chef_signature_dishes: Array<{ id: string; name: string; description: string | null; photo_url: string | null; order: number }>
}

type Experience = {
  id: string
  rating: number
  note: string | null
  visited_at: string
  restaurant_id: string
  restaurants: { id: string; name: string; city: string; michelin_stars: number } | null
}

type ContentItem = {
  type: 'feed' | 'experience'
  id: string
  restaurant_id: string
  content_url?: string | null
  rating?: number
  note?: string | null
  visited_at?: string
  created_at?: string
  likes_count?: number
  restaurants: { id: string; name: string; description?: string | null } | null
}

type Tab = 'posts' | 'likes' | 'saved'

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  userId: string
  isSelf: boolean
  showBackButton?: boolean
  variant?: 'dark' | 'light'
}

export default function UserProfileView({ userId, isSelf, showBackButton = false, variant = 'dark' }: Props) {
  const isLight = variant === 'light'
  const router = useRouter()
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [chefData, setChefData] = useState<ChefData | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [liked, setLiked] = useState<ContentItem[]>([])
  const [saved, setSaved] = useState<ContentItem[]>([])
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('posts')
  const [showMenu, setShowMenu] = useState(false)
  const [selected, setSelected] = useState<Experience | null>(null)
  const [selectedFeed, setSelectedFeed] = useState<ContentItem | null>(null)
  const [openVideo, setOpenVideo] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/users/${userId}`).then(r => r.json()),
      fetch(`/api/experiences?user_id=${userId}`).then(r => r.json()),
      fetch(`/api/users/${userId}/followers`).then(r => r.json()),
      fetch(`/api/users/${userId}/following`).then(r => r.json()),
      fetch(`/api/users/${userId}/likes`).then(r => r.json()),
      fetch(`/api/users/${userId}/bookmarks`).then(r => r.json()),
    ]).then(async ([user, exps, followers, followingList, likes, bookmarks]) => {
      setProfile(user)
      setExperiences(Array.isArray(exps) ? exps : [])
      setFollowersCount(Array.isArray(followers) ? followers.length : 0)
      setFollowingCount(Array.isArray(followingList) ? followingList.length : 0)
      setLiked(Array.isArray(likes) ? likes : [])
      setSaved(Array.isArray(bookmarks) ? bookmarks : [])
      if (user?.role === 'chef') {
        const chef = await fetch(`/api/chefs/${userId}`).then(r => r.json()).catch(() => null)
        setChefData(chef)
      }
    }).finally(() => setLoading(false))
  }, [userId])

  useEffect(() => {
    if (!isSelf && session?.user?.id && userId) {
      fetch(`/api/users/${userId}/follow`)
        .then(r => r.json())
        .then(d => setFollowing(!!d.following))
    }
  }, [isSelf, session, userId])

  const handleFollow = async () => {
    if (!session) return
    setFollowing(f => !f)
    await fetch(`/api/users/${userId}/follow`, { method: following ? 'DELETE' : 'POST' })
  }

  const handleItemSelect = (item: ContentItem) => {
    if (item.type === 'feed') setSelectedFeed(item)
    else setSelected(item as unknown as Experience)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
        <div className="w-8 h-8 border-2 border-gray-300 dark:border-white/20 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const avatarUrl = profile?.avatar_url ?? `https://picsum.photos/seed/${profile?.username ?? userId}/200/200`
  const isChef = profile?.role === 'chef'
  const isInspector = profile?.role === 'inspecteur'
  const dishes = chefData?.chef_signature_dishes?.sort((a, b) => a.order - b.order) ?? []

  const roleLabel = (() => {
    const role = profile?.role
    const score = profile?.circle_score ?? 0
    if (role === 'chef') return 'Chef'
    if (role === 'restaurateur') return 'Restaurateur'
    if (role === 'inspecteur') return 'Inspecteur'
    if (score >= 200) return 'Grand Gourmet'
    if (score >= 100) return 'Gourmet'
    if (score >= 50) return 'Gastronome'
    if (score >= 20) return 'Amateur éclairé'
    return 'Curieux'
  })()

  return (
    <div className={`flex flex-col min-h-dvh pb-28 ${isLight ? 'bg-white' : 'bg-black'}`}>

      {/* ── Top bar ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-14 pb-4">
        {showBackButton ? (
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#E4002B' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}

        <div className="flex-1" />

        {isSelf ? (
          <button
            onClick={() => setShowMenu(true)}
            className="w-9 h-9 flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleFollow}
            className="px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
            style={following
              ? { background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }
              : { background: '#E4002B', color: 'white' }
            }
          >
            {following ? 'Suivi ✓' : '+ Suivre'}
          </button>
        )}
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
      <main className="flex-1 flex flex-col items-center h-full overflow-y-auto pb-28 lg:pb-0">
        
        {/* Conteneur centré avec max-w-4xl */}
        <div className="w-full max-w-4xl">
          {/* Mobile Header */}
          <div className="lg:hidden sticky top-0 z-30 px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
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

          {/* ── Top bar ── */}
          <div className="flex items-center justify-between px-4 pt-14 lg:pt-6 pb-4">
            {showBackButton ? (
              <button
                onClick={() => router.back()}
                className="w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-gray-900 dark:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            ) : (
              <div className="w-9" />
            )}

            <div className="flex-1" />

            {isSelf ? (
              <button
                onClick={() => setShowMenu(true)}
                className="w-9 h-9 flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6 text-gray-900 dark:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleFollow}
                className="px-4 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95"
                style={following
                  ? { background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', color: '#000' }
                  : { background: '#E4002B', color: 'white' }
                }
              >
                {following ? 'Suivi ✓' : '+ Suivre'}
              </button>
            )}
          </div>

          {/* ── Avatar + stats + nom ── */}
          <div className="flex flex-col items-center px-4 mb-4 gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-gray-200 dark:border-white/20 bg-gray-100 dark:bg-neutral-800 p-[3px]">
                <div className="w-full h-full rounded-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
              </div>
              {isChef && chefData?.video_url && (
                <button
                  onClick={() => setOpenVideo(chefData.video_url!)}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white dark:border-black"
                  style={{ background: '#E4002B' }}
                >
                  <svg viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5 ml-0.5">
                    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                  </svg>
                </button>
              )}
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {profile?.username}
              </p>
              <p className="text-xs font-normal mt-0.5 text-gray-500 dark:text-gray-400">
                {isChef ? '👨‍🍳 ' : isInspector ? '🕵️ ' : ''}{roleLabel}
              </p>
            </div>

      {/* ── Sections Chef ────────────────────────────────────── */}
      {isChef && chefData && (
        <>
          {chefData.restaurants && (
            <div className="mb-5">
              <p className={`font-bold text-sm px-4 mb-2 ${isLight ? 'text-[#262626]' : 'text-white'}`}>Retrouvez moi au</p>
              <Link
                href={`/restaurant/${chefData.restaurants.id}`}
                className="flex items-center gap-3 w-full px-4 py-1.5 transition-colors"
                style={{ background: isLight ? '#F2F2F2' : '#2D2D2D' }}
              >
                <div
                  className="w-12 h-12 rounded-full bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(https://picsum.photos/seed/${chefData.restaurants.id.slice(0, 8)}food/100/100)` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <p className={`font-black text-sm truncate ${isLight ? 'text-[#262626]' : 'text-white'}`}>{chefData.restaurants.name}</p>
                    {chefData.restaurants.michelin_stars > 0 && (
                      <Stars count={chefData.restaurants.michelin_stars} green={chefData.restaurants.green_stars} size="xs" />
                    )}
                  </div>
                  <p style={{ color: '#B1B1B1' }} className="text-xs font-normal mt-0.5">{chefData.restaurants.city}</p>
                </div>
              ))}
            </div>
          </div>

          {chefData.bio && (
            <div className="px-4 mb-5">
              <p className={`font-bold text-sm mb-2 ${isLight ? 'text-[#262626]' : 'text-white'}`}>Mon histoire</p>
              <p style={{ color: isLight ? '#262626' : '#B1B1B1' }} className="text-xs font-normal leading-relaxed">{chefData.bio}</p>
            </div>
          )}

          {dishes.length > 0 && (
            <div className="mb-5">
              <p className={`font-bold text-sm px-4 mb-3 ${isLight ? 'text-[#262626]' : 'text-white'}`}>Mes plats signatures</p>
              <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                {dishes.map(dish => {
                  const img = dish.photo_url ?? `https://picsum.photos/seed/${dish.name.replace(/\s/g, '').toLowerCase()}/300/300`
                  return (
                    <div key={dish.id} className={`flex-shrink-0 w-40 rounded-2xl overflow-hidden border ${isLight ? 'bg-neutral-100 border-black/5' : 'bg-neutral-900 border-white/5'}`}>
                      <div className="w-full h-28 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                      <div className="p-3">
                        <p className={`font-medium text-xs text-center leading-tight ${isLight ? 'text-[#262626]' : 'text-white'}`}>{dish.name}</p>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs font-normal mt-0.5">{chefData.restaurants.city}</p>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#E4002B" strokeWidth={2} className="w-6 h-6 flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              )}

              {chefData.bio && (
                <div className="px-4 mb-5">
                  <p className="text-gray-900 dark:text-white font-bold text-sm mb-2">Mon histoire</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-normal leading-relaxed">{chefData.bio}</p>
                </div>
              )}

              {dishes.length > 0 && (
                <div className="mb-5">
                  <p className="text-gray-900 dark:text-white font-bold text-sm px-4 mb-3">Mes plats signatures</p>
                  <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide">
                    {dishes.map(dish => {
                      const img = dish.photo_url ?? `https://picsum.photos/seed/${dish.name.replace(/\s/g, '').toLowerCase()}/300/300`
                      return (
                        <div key={dish.id} className="flex-shrink-0 w-40 rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-white/5">
                          <div className="w-full h-28 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                          <div className="p-3">
                            <p className="text-gray-900 dark:text-white font-medium text-xs text-center leading-tight">{dish.name}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className={`flex border-t border-b ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}>
        {([
          {
            key: 'posts' as Tab,
            icon: (active: boolean) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/icons/etoile-michelin.svg"
                alt=""
                className="w-5 h-5"
                style={active ? {} : { filter: 'brightness(0) saturate(0%) invert(75%)' }}
              />
            ),
          },
          {
            key: 'likes' as Tab,
            icon: (active: boolean) => (
              <svg viewBox="0 0 24 24" fill={active ? '#D30792' : 'none'} stroke={active ? '#D30792' : 'currentColor'} strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            ),
          },
          {
            key: 'saved' as Tab,
            icon: (active: boolean) => (
              <svg viewBox="0 0 24 24" fill={active ? '#D34807' : 'none'} stroke={active ? '#D34807' : 'currentColor'} strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
            ),
          },
        ]).map(({ key, icon }) => {
          const isActive = tab === key
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 flex items-center justify-center py-3 transition-opacity border-t-2 ${isActive ? 'opacity-100' : 'opacity-30 border-transparent'}`}
              style={{ borderColor: isActive ? '#B1B1B1' : undefined, color: '#B1B1B1' }}
            >
              {icon(isActive)}
            </button>
          )
        })}
      </div>

          {/* ── Contenu ── */}
          {tab === 'posts' && (
            experiences.length === 0
              ? <EmptyState emoji="🍽️" text="Aucune expérience" sub="Les visites de restaurants apparaîtront ici." />
              : <ExperienceGrid experiences={experiences} onSelect={setSelected} />
          )}

          {tab === 'likes' && (
            liked.length === 0
              ? <EmptyState icon={<HeartIconLg />} text="Aucun like" sub="Les posts et expériences aimés apparaîtront ici." />
              : <ContentGrid items={liked} onSelect={handleItemSelect} />
          )}

          {tab === 'saved' && (
            saved.length === 0
              ? <EmptyState icon={<BookmarkIconLg />} text="Aucun enregistrement" sub="Les posts sauvegardés apparaîtront ici." />
              : <ContentGrid items={saved} onSelect={handleItemSelect} />
          )}
        </div>
      </main>

      {/* ── Sheets ── */}
      {selected && (
        <ExperienceSheet
          exp={selected}
          profile={profile}
          avatarUrl={avatarUrl}
          roleLabel={roleLabel}
          onClose={() => setSelected(null)}
        />
      )}

      {selectedFeed && (
        <FeedSheet item={selectedFeed} onClose={() => setSelectedFeed(null)} />
      )}

      {openVideo && (
        <div className="fixed inset-0 z-50 bg-black" onClick={() => setOpenVideo(null)}>
          <button className="absolute top-12 right-4 z-10 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <video src={openVideo} className="w-full h-full object-contain" autoPlay controls playsInline onClick={e => e.stopPropagation()} />
        </div>
      )}

      {showMenu && (
        <MenuSheet onClose={() => setShowMenu(false)} />
      )}

      {!selected && !selectedFeed && !openVideo && !showMenu && <BottomNav />}
    </div>
  )
}

// ── Menu sheet (isSelf) ──
function MenuSheet({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-950 rounded-t-3xl overflow-hidden">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
        </div>
        <div className="px-4 py-4 pb-10 flex flex-col gap-1">
          <button
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-4 rounded-2xl active:bg-gray-100 dark:active:bg-white/5 transition-colors text-left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 opacity-60 text-gray-900 dark:text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
            <span className="text-gray-900 dark:text-white/80 text-sm font-medium">Modifier le profil</span>
          </button>
          <div className="h-px bg-gray-200 dark:bg-white/5 mx-4" />
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-3 px-4 py-4 rounded-2xl active:bg-gray-100 dark:active:bg-white/5 transition-colors text-left"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 opacity-60 text-gray-900 dark:text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            <span className="text-gray-900 dark:text-white/80 text-sm font-medium">Se déconnecter</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Experience grid ──
function ExperienceGrid({ experiences, onSelect }: { experiences: Experience[]; onSelect: (e: Experience) => void }) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {experiences.map(exp => {
        const seed = exp.restaurant_id.replace(/-/g, '').slice(0, 8)
        return (
          <button
            key={exp.id}
            onClick={() => onSelect(exp)}
            className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-neutral-900 active:opacity-80 transition-opacity"
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/300/300)` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-1.5 left-1.5 flex gap-0.5">
              {Array.from({ length: exp.rating }).map((_, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src="/icons/etoile-michelin.svg" alt="" className="w-3 h-3" style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(97%) saturate(7471%) hue-rotate(340deg) brightness(97%) contrast(109%)' }} />
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Content grid (likes / saved) ──
function ContentGrid({ items, onSelect }: { items: ContentItem[]; onSelect: (item: ContentItem) => void }) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {items.map(item => {
        const seed = item.restaurant_id.replace(/-/g, '').slice(0, 8)
        return (
          <button
            key={`${item.type}-${item.id}`}
            onClick={() => onSelect(item)}
            className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-neutral-900 active:opacity-80 transition-opacity"
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/300/300)` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {item.type === 'feed' && (
              <div className="absolute top-1.5 right-1.5">
                <div className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5 ml-0.5">
                    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                  </svg>
                </div>
              </div>
            )}
            {item.type === 'experience' && (item.rating ?? 0) > 0 && (
              <div className="absolute bottom-1.5 left-1.5 flex gap-0.5">
                {Array.from({ length: item.rating ?? 0 }).map((_, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src="/icons/etoile-michelin.svg" alt="" className="w-3 h-3" style={{ filter: 'brightness(0) saturate(100%) invert(13%) sepia(97%) saturate(7471%) hue-rotate(340deg) brightness(97%) contrast(109%)' }} />
                ))}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Empty state ──
function EmptyState({ emoji, icon, text, sub }: { emoji?: string; icon?: React.ReactNode; text: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
      {emoji ? <span className="text-4xl">{emoji}</span> : icon}
      <p className="text-gray-900 dark:text-white font-semibold text-sm">{text}</p>
      <p className="text-gray-500 dark:text-white/30 text-xs">{sub}</p>
    </div>
  )
}

// ── Experience bottom sheet ──
function ExperienceSheet({
  exp, profile, avatarUrl, roleLabel, onClose,
}: {
  exp: Experience
  profile: UserProfile | null
  avatarUrl: string
  roleLabel: string
  onClose: () => void
}) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/experiences/${exp.id}/like`).then(r => r.json()),
      fetch(`/api/experiences/${exp.id}/bookmark`).then(r => r.json()),
    ]).then(([likeData, bookmarkData]) => {
      setLiked(!!likeData.liked)
      setLikeCount(likeData.count ?? 0)
      setSaved(!!bookmarkData.saved)
    })
  }, [exp.id])

  const seed = exp.restaurant_id.replace(/-/g, '').slice(0, 8)
  const date = new Date(exp.visited_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const likedByText = liked
    ? likeCount === 1 ? 'Aimé par toi' : `Aimé par toi et ${likeCount - 1} autre${likeCount > 2 ? 's' : ''}`
    : likeCount > 0 ? `${likeCount} j'aime` : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-950 rounded-t-3xl overflow-hidden max-h-[88dvh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
        </div>
        <div className="overflow-y-auto">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-900 dark:text-white font-bold text-sm">@{profile?.username}</p>
              <p className="text-gray-500 dark:text-white/40 text-xs">{roleLabel}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-900 dark:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="w-full aspect-square bg-cover bg-center" style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/600/600)` }} />
          <div className="px-4 py-3">
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => {
                  const next = !liked
                  setLiked(next)
                  setLikeCount(c => next ? c + 1 : c - 1)
                  fetch(`/api/experiences/${exp.id}/like`, { method: next ? 'POST' : 'DELETE' })
                }}
                className="active:scale-90 transition-transform"
              >
                <svg viewBox="0 0 24 24" fill={liked ? '#E4002B' : 'none'} stroke={liked ? '#E4002B' : 'currentColor'} strokeWidth={1.5} className="w-7 h-7 text-gray-900 dark:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const next = !saved
                  setSaved(next)
                  fetch(`/api/experiences/${exp.id}/bookmark`, { method: next ? 'POST' : 'DELETE' })
                }}
                className="active:scale-90 transition-transform"
              >
                <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-gray-900 dark:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
              </button>
            </div>
            {likedByText && <p className="text-gray-900 dark:text-white text-sm font-semibold mb-1">{likedByText}</p>}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-gray-900 dark:text-white font-black text-sm">{exp.restaurants?.name ?? 'Restaurant'}</span>
              <span className="text-gray-400 dark:text-white/30">·</span>
              <span className="flex gap-0.5">
                {Array.from({ length: exp.rating }).map((_, i) => (
                  <span key={i} className="text-xs" style={{ color: '#C9AA71' }}>★</span>
                ))}
              </span>
            </div>
            {exp.note && <p className="text-gray-600 dark:text-white/70 text-sm mb-2 leading-snug">&ldquo;{exp.note}&rdquo;</p>}
            <p className="text-gray-400 dark:text-white/30 text-xs">{date}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Feed bottom sheet ──
function FeedSheet({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(item.likes_count ?? 0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/feed/posts/${item.id}/like`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/feed/posts/${item.id}/bookmark`).then(r => r.json()).catch(() => ({})),
    ]).then(([likeData, bookmarkData]) => {
      setLiked(!!likeData.liked)
      if (likeData.count !== undefined) setLikeCount(likeData.count)
      setSaved(!!bookmarkData.saved)
    })
    videoRef.current?.play().catch(() => {})
  }, [item.id])

  const seed = item.restaurant_id.replace(/-/g, '').slice(0, 8)
  const date = item.created_at
    ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const likedByText = liked
    ? likeCount === 1 ? 'Aimé par toi' : `Aimé par toi et ${likeCount - 1} autre${likeCount > 2 ? 's' : ''}`
    : likeCount > 0 ? `${likeCount} j'aime` : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-neutral-950 rounded-t-3xl overflow-hidden max-h-[92dvh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
        </div>
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/80/80)` }} />
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white font-bold text-sm truncate">{item.restaurants?.name ?? 'Restaurant'}</p>
            <p className="text-gray-500 dark:text-white/40 text-xs">Vidéo du restaurant</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-900 dark:text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="relative bg-black overflow-hidden flex-shrink-0" style={{ aspectRatio: '9/16', maxHeight: '60dvh' }}>
          {item.content_url ? (
            <video ref={videoRef} src={item.content_url} className="w-full h-full object-cover" loop muted playsInline />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-10">🎬</span>
            </div>
          )}
        </div>
        <div className="px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => {
                const next = !liked
                setLiked(next)
                setLikeCount(c => next ? c + 1 : c - 1)
                fetch(`/api/feed/posts/${item.id}/like`, { method: next ? 'POST' : 'DELETE' })
              }}
              className="active:scale-90 transition-transform"
            >
              <svg viewBox="0 0 24 24" fill={liked ? '#E4002B' : 'none'} stroke={liked ? '#E4002B' : 'currentColor'} strokeWidth={1.5} className="w-7 h-7 text-gray-900 dark:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </button>
            <button
              onClick={() => {
                const next = !saved
                setSaved(next)
                fetch(`/api/feed/posts/${item.id}/bookmark`, { method: next ? 'POST' : 'DELETE' })
              }}
              className="active:scale-90 transition-transform"
            >
              <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-7 h-7 text-gray-900 dark:text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
            </button>
          </div>
          {likedByText && <p className="text-gray-900 dark:text-white text-sm font-semibold mb-1">{likedByText}</p>}
          <p className="text-gray-900 dark:text-white font-black text-sm mb-0.5">{item.restaurants?.name ?? 'Restaurant'}</p>
          {item.restaurants?.description && (
            <p className="text-gray-600 dark:text-white/60 text-xs leading-snug mb-1.5 line-clamp-2">{item.restaurants.description}</p>
          )}
          {date && <p className="text-gray-400 dark:text-white/30 text-xs">{date}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Icônes ──
function HeartIconLg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-12 h-12 opacity-10 text-gray-900 dark:text-white">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )
}

function BookmarkIconLg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-12 h-12 opacity-10 text-gray-900 dark:text-white">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
  )
}