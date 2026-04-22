'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'
import Stars from '@/components/ui/Stars'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'

type Restaurant = {
  id: string
  name: string
  city: string
  country: string
  michelin_stars: number
  green_stars: boolean
  description?: string
  dietary_option?: string | null
}

type Chef = {
  id: string
  bio?: string | null
  users?: { id?: string; username?: string; avatar_url?: string | null } | null
}

type Post = {
  id: string
  content_url: string | null
  likes_count: number
}

type Dish = {
  id: string
  name: string
  description?: string | null
  photo_url?: string | null
  order: number
}

// Navigation items pour la sidebar
const navItems = [
  { href: '/', label: 'Pour toi', icon: (_active: boolean) => (
    <svg viewBox="0 0 24 24" fill={_active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
    </svg>
  )},
  { href: '/', label: 'Explorer', icon: (_active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  )},
  { href: '/amis', label: 'Communauté', icon: (_active: boolean) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )},
  { href: '/map', label: 'Carte', icon: (_active: boolean) => (
    <svg viewBox="0 0 24 24" fill={_active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )},
  { href: '/profil', label: 'Profil', icon: (_active: boolean) => (
    <svg viewBox="0 0 24 24" fill={_active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  )},
]

// Mock data
const MOCK_CUISINE: Record<number, string> = {
  0: 'Cuisine de Saison',
  1: 'Gastronomie Française',
  2: 'Haute Gastronomie · Menu Dégustation',
  3: 'Grande Gastronomie · 12-Course Tasting',
}

const MOCK_HOURS = 'Mar – Sam  ·  12h – 14h  &  19h30 – 22h'
const MOCK_HOURS_CLOSED = 'Fermé Dimanche & Lundi'

const MOCK_PRACTICAL = [
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>, label: 'Sommelier\nPairing' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>, label: 'Formal\nAttire' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>, label: '2–4 Hour\nExp.' },
  { icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.22-1.113-.615-1.53a15.04 15.04 0 0 0-2.084-1.598 2.566 2.566 0 0 0-1.44-.387H4.5a2.25 2.25 0 0 0-2.25 2.25v6.75c0 .621.504 1.125 1.125 1.125h1.125" /></svg>, label: 'Valet\nAvailable' },
]

const MOCK_DISHES = [
  { id: 'm1', name: 'Amuse Bouche', description: 'Smoked oyster pearl, caviar, algue marine', photo_url: 'https://picsum.photos/seed/amuse/300/300', order: 1 },
  { id: 'm2', name: 'Foie Gras', description: 'Torchon, brioche maison, chutney de figues', photo_url: 'https://picsum.photos/seed/foiegras/300/300', order: 2 },
  { id: 'm3', name: 'Homard Bleu', description: 'Beurre nantais, émulsion de corail', photo_url: 'https://picsum.photos/seed/homard/300/300', order: 3 },
  { id: 'm4', name: 'Wagyu A5', description: 'Jus corsé, truffe noire, pomme soufflée', photo_url: 'https://picsum.photos/seed/wagyu/300/300', order: 4 },
  { id: 'm5', name: 'Soufflé', description: 'Grand Marnier, glace vanille Madagascar', photo_url: 'https://picsum.photos/seed/souffle/300/300', order: 5 },
]

// Video fullscreen modal
function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black dark:bg-black" onClick={onClose}>
      <button className="absolute top-12 right-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <video
        src={url}
        className="w-full h-full object-contain"
        autoPlay
        controls
        playsInline
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}

// Page principale
export default function RestaurantPageClient({
  restaurant,
  chefs,
  posts,
  menuDishes,
}: {
  restaurant: Restaurant
  chefs: Chef[]
  posts: Post[]
  menuDishes: Dish[]
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  // Supprimé: const router = useRouter() - non utilisé
  const [liked, setLiked] = useState(false)
  const [openVideo, setOpenVideo] = useState<string | null>(null)
  const [showAuthGate, setShowAuthGate] = useState(false)

  const stars = restaurant.michelin_stars ?? 0
  const seed = restaurant.id.replace(/-/g, '').slice(0, 8)
  const heroImg = `https://picsum.photos/seed/${seed}food/900/600`
  const cuisine = MOCK_CUISINE[stars] ?? MOCK_CUISINE[0]
  const dishes = menuDishes.length > 0 ? menuDishes : MOCK_DISHES
  const videos = posts.filter(p => p.content_url)

  const handleLike = () => {
    if (!session) {
      setShowAuthGate(true)
      return
    }
    setLiked(!liked)
  }

  return (
    <>
      {openVideo && <VideoModal url={openVideo} onClose={() => setOpenVideo(null)} />}
      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}

      <div className="min-h-dvh bg-white dark:bg-black">
        {/* Layout avec sidebar à gauche comme TikTok (desktop) */}
        <div className="flex">
          {/* Sidebar gauche - Navigation (visible seulement sur desktop) */}
          <aside className="hidden lg:flex lg:flex-col lg:w-[240px] xl:w-[260px] h-screen sticky top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
            <div className="px-4 py-5">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E4002B]">
                  <Image src="/icons/etoile-michelin.svg" alt="Michelin" width={16} height={16} className="w-4 h-4 brightness-0 invert" />
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
                  <input type="text" placeholder="Rechercher un restaurant, un chef..." className="w-full pl-10 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:bg-white dark:focus:bg-gray-800 transition-colors" />
                </div>
              </div>
            </div>

            {/* Contenu restaurant */}
            <div className="lg:max-w-4xl lg:mx-auto lg:px-8">
              {/* Hero section */}
              <div className="relative w-full h-80 lg:h-96">
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImg})` }} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-transparent dark:from-black/70 dark:via-black/30" />

                <Link href="/" className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>

                <button onClick={handleLike} className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill={liked ? '#E4002B' : 'none'} stroke={liked ? '#E4002B' : 'white'} strokeWidth={1.8} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                  </svg>
                </button>

                <div className="absolute bottom-4 left-4 right-4">
                  {(stars > 0 || restaurant.green_stars) && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <Stars count={stars} green={restaurant.green_stars} size="sm" />
                    </div>
                  )}
                  <h1 className="text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight uppercase">{restaurant.name}</h1>
                  <p className="text-white/70 text-xs mt-1">{restaurant.city}, {restaurant.country}</p>
                </div>
              </div>

              {/* Infos restaurant */}
              <div className="px-4 lg:px-0 pt-4 pb-20">
                {restaurant.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">{restaurant.description}</p>
                )}

                {/* Type de cuisine */}
                <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-500 dark:text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-gray-900 dark:text-white text-sm font-medium">{cuisine}</span>
                  </div>
                </div>

                {/* Horaires */}
                <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                  <div className="flex items-start gap-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm">{MOCK_HOURS}</p>
                      <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">{MOCK_HOURS_CLOSED}</p>
                    </div>
                  </div>
                </div>

                {/* Chefs */}
                {chefs.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-gray-900 dark:text-white font-bold text-sm mb-3">{chefs.length > 1 ? 'Nos Chefs' : 'Chef Exécutif'}</h2>
                    <div className="flex flex-col gap-3">
                      {chefs.map((chef) => {
                        const avatarSeed = chef.users?.username ?? chef.id.slice(0, 6)
                        const avatarUrl = chef.users?.avatar_url ?? `https://picsum.photos/seed/${avatarSeed}/100/100`
                        return (
                          <Link key={chef.id} href={`/chef/${chef.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
                              <Image src={avatarUrl} alt={chef.users?.username ?? 'Chef'} width={48} height={48} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-900 dark:text-white font-semibold text-sm">{chef.users?.username ?? 'Chef'}</p>
                              {chef.bio && <p className="text-gray-500 dark:text-gray-400 text-xs truncate">{chef.bio}</p>}
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-gray-400">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Menu */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-gray-900 dark:text-white font-bold text-sm">Menu Dégustation</h2>
                    <button className="text-[#E4002B] text-xs font-semibold uppercase tracking-wider hover:opacity-80 transition-opacity">
                      Voir tout
                    </button>
                  </div>
                  
                  {/* Container avec scroll horizontal et barre cachée */}
                  <div className="relative">
                    <div 
                      className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide"
                      style={{
                        scrollbarWidth: 'none', // Firefox
                        msOverflowStyle: 'none', // IE/Edge
                      }}
                    >
                      {dishes.map((dish) => {
                        const img = dish.photo_url ?? `https://picsum.photos/seed/${dish.name.replace(/\s/g, '').toLowerCase()}/300/300`
                        return (
                          <div 
                            key={dish.id} 
                            className="group flex-shrink-0 w-40 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-[#E4002B]/30 transition-all duration-300"
                          >
                            <div className="relative w-full h-24 bg-cover bg-center transition-transform duration-300 group-hover:scale-105" style={{ backgroundImage: `url(${img})` }}>
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
                            </div>
                            <div className="p-2">
                              <p className="text-gray-900 dark:text-white font-semibold text-xs uppercase leading-tight line-clamp-1">
                                {dish.name}
                              </p>
                              {dish.description && (
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] leading-snug mt-1 line-clamp-2">
                                  {dish.description}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    {/* Dégradés aux extrémités pour indiquer le scroll (optionnel) */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-black to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-black to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Infos pratiques */}
                <div className="mb-6">
                  <h2 className="text-gray-900 dark:text-white font-bold text-sm mb-3">Infos pratiques</h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {MOCK_PRACTICAL.map(({ icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <div className="text-gray-600 dark:text-gray-400">{icon}</div>
                        <span className="text-gray-500 dark:text-gray-400 text-[9px] text-center leading-tight font-medium whitespace-pre-line">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vidéos */}
                {videos.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-gray-900 dark:text-white font-bold text-sm mb-3">Vidéos</h2>
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {videos.map((p) => (
                        <button key={p.id} onClick={() => setOpenVideo(p.content_url!)} className="relative flex-shrink-0 w-32 h-48 rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800">
                          <video src={p.content_url!} className="w-full h-full object-cover" muted playsInline />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                              <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 ml-0.5">
                                <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>

        {/* Sticky CTA (mobile et desktop) */}
        <div className="fixed bottom-0 left-0 right-0 z-[100] px-4 pb-6 pt-4 bg-gradient-to-t from-white dark:from-black to-transparent">
          <div className="flex justify-center">
            <button className="w-full max-w-[300px] py-3.5 rounded-xl font-bold text-white text-sm tracking-wide uppercase active:scale-[0.98] transition-transform" style={{ background: '#E4002B' }}>
              Réserver une table
            </button>
          </div>
        </div>

        {/* Bottom nav mobile */}
        <div className="lg:hidden">
          <BottomNav />
        </div>
      </div>
    </>
  )
}