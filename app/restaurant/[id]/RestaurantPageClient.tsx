'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import Stars from '@/components/ui/Stars'

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

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_CUISINE: Record<number, string> = {
  0: 'Cuisine de Saison',
  1: 'Gastronomie Française',
  2: 'Haute Gastronomie · Menu Dégustation',
  3: 'Grande Gastronomie · 12-Course Tasting',
}

const MOCK_HOURS = 'Mar – Sam  ·  12h – 14h  &  19h30 – 22h'
const MOCK_HOURS_CLOSED = 'Fermé Dimanche & Lundi'

const MOCK_PRACTICAL = [
  { icon: '🍷', label: 'Sommelier\nPairing' },
  { icon: '👔', label: 'Formal\nAttire' },
  { icon: '⏱', label: '2–4 Hour\nExp.' },
  { icon: '🅿️', label: 'Valet\nAvailable' },
]

const MOCK_DISHES = [
  { id: 'm1', name: 'Amuse Bouche', description: 'Smoked oyster pearl, caviar, algue marine', photo_url: 'https://picsum.photos/seed/amuse/300/300', order: 1 },
  { id: 'm2', name: 'Foie Gras', description: 'Torchon, brioche maison, chutney de figues', photo_url: 'https://picsum.photos/seed/foiegras/300/300', order: 2 },
  { id: 'm3', name: 'Homard Bleu', description: 'Beurre nantais, émulsion de corail', photo_url: 'https://picsum.photos/seed/homard/300/300', order: 3 },
  { id: 'm4', name: 'Wagyu A5', description: 'Jus corsé, truffe noire, pomme soufflée', photo_url: 'https://picsum.photos/seed/wagyu/300/300', order: 4 },
  { id: 'm5', name: 'Soufflé', description: 'Grand Marnier, glace vanille Madagascar', photo_url: 'https://picsum.photos/seed/souffle/300/300', order: 5 },
]

// ── Video fullscreen modal ────────────────────────────────────────────────────

function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={onClose}>
      <button className="absolute top-12 right-4 z-10 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
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

// ── Page ─────────────────────────────────────────────────────────────────────

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
  const router = useRouter()
  const [liked, setLiked] = useState(false)
  const [openVideo, setOpenVideo] = useState<string | null>(null)

  const stars = restaurant.michelin_stars ?? 0
  const seed = restaurant.id.replace(/-/g, '').slice(0, 8)
  const heroImg = `https://picsum.photos/seed/${seed}food/900/600`
  const cuisine = MOCK_CUISINE[stars] ?? MOCK_CUISINE[0]
  const dishes = menuDishes.length > 0 ? menuDishes : MOCK_DISHES
  const videos = posts.filter(p => p.content_url)

  return (
    <>
      {openVideo && <VideoModal url={openVideo} onClose={() => setOpenVideo(null)} />}

      <div className="flex h-screen bg-white dark:bg-neutral-950">

        {/* ─── SIDEBAR GAUCHE (lg+) ─── */}
        <aside className="hidden lg:flex flex-col w-52 xl:w-60 2xl:w-72 shrink-0 border-r border-gray-200 dark:border-gray-800 h-full overflow-y-auto bg-white dark:bg-black p-4 xl:p-6 z-20 relative">
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
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.954c.44-.44 1.152-.44 1.592 0L21.75 12M4.5 10.5v6.75a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V10.5" /></svg>
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
                icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503-6.024c.61-.166 1.212-.358 1.809-.576A6 6 0 1 0 6 12c.662.346 1.312.708 1.957 1.085.663 1.102 2.218 1.843 3.976 1.843c2.913 0 5.321-2.296 5.75-5.933Z" /></svg>
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
        <main className="flex-1 flex flex-col items-center h-full overflow-y-auto pb-32 lg:pb-0">

          {/* Conteneur centré avec max-w-4xl */}
          <div className="w-full max-w-4xl">

            {/* ── Hero ── */}
            <div className="relative w-full" style={{ height: '48vh', minHeight: 280 }}>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${heroImg})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-white dark:to-neutral-950" />

              <button
                onClick={() => router.back()}
                className="absolute top-12 left-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                onClick={() => setLiked(l => !l)}
                className="absolute top-12 right-4 z-10 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
              >
                <svg viewBox="0 0 24 24" fill={liked ? '#E4002B' : 'none'} stroke={liked ? '#E4002B' : 'white'} strokeWidth={1.8} className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </button>
            </div>

            {/* ── Identité (centré) ── */}
            <div className="px-6 pt-5 text-center">
              {(stars > 0 || restaurant.green_stars) && (
                <div className="flex items-center justify-center gap-1.5 mb-2">
                  <Stars count={stars} green={restaurant.green_stars} size="sm" />
                  <span className="text-gray-500 dark:text-white/50 text-[10px] font-semibold uppercase tracking-widest">
                    Michelin {stars === 1 ? 'Star' : 'Stars'}
                  </span>
                </div>
              )}
              <h1 className="text-3xl font-black tracking-tight leading-tight uppercase text-gray-900 dark:text-white">{restaurant.name}</h1>
              <p className="text-gray-500 dark:text-white/50 text-xs mt-1.5 mb-3">{cuisine}</p>
              {restaurant.description && (
                <p className="text-gray-600 dark:text-white/60 text-sm leading-relaxed max-w-xs mx-auto">{restaurant.description}</p>
              )}
            </div>

            {/* ── Adresse & Horaires ── */}
            <div className="mx-4 mt-5 rounded-2xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-white/5 divide-y divide-gray-200 dark:divide-white/5">
              <div className="flex items-center gap-3 px-4 py-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 flex-shrink-0 opacity-40 text-gray-900 dark:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <p className="text-gray-900 dark:text-white text-sm">{restaurant.city}, {restaurant.country}</p>
              </div>
              <div className="flex items-start gap-3 px-4 py-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 mt-0.5 flex-shrink-0 opacity-40 text-gray-900 dark:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <div>
                  <p className="text-gray-900 dark:text-white text-sm" dangerouslySetInnerHTML={{ __html: MOCK_HOURS }} />
                  <p className="text-gray-500 dark:text-white/40 text-xs mt-0.5">{MOCK_HOURS_CLOSED}</p>
                </div>
              </div>
            </div>

            {/* ── Chefs (centré) ── */}
            {chefs.length > 0 && (
              <div className="mt-8 px-4">
                <p className="text-gray-400 dark:text-white/30 text-[10px] font-bold uppercase tracking-widest text-center mb-4">
                  {chefs.length > 1 ? 'Nos Chefs' : 'Chef Exécutif'}
                </p>
                <div className="flex flex-col gap-3">
                  {chefs.map((chef) => {
                    const avatarSeed = chef.users?.username ?? chef.id.slice(0, 6)
                    const avatarUrl = chef.users?.avatar_url ?? `https://picsum.photos/seed/${avatarSeed}/100/100`
                    return (
                      <Link
                        key={chef.id}
                        href={`/chef/${chef.id}`}
                        className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-white/5 active:bg-gray-200 dark:active:bg-neutral-800 transition-colors"
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-300 dark:bg-neutral-700 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-center">
                          <p className="text-gray-900 dark:text-white font-black text-sm">
                            {chef.users?.username ?? 'Chef'}
                          </p>
                          <p className="text-gray-500 dark:text-white/30 text-[10px] uppercase tracking-widest font-semibold mb-1">Executive Chef</p>
                          {chef.bio && (
                            <p className="text-gray-600 dark:text-white/50 text-xs italic leading-relaxed line-clamp-3">&ldquo;{chef.bio}&rdquo;</p>
                          )}
                        </div>
                        <span className="text-gray-500 dark:text-white/40 text-[10px] font-semibold flex items-center gap-1 mt-1">
                          Voir le profil
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Menu carousel ── */}
            <div className="mt-8">
              <div className="flex items-center justify-between px-4 mb-3">
                <p className="text-gray-900 dark:text-white font-black text-sm">The Tasting Menu</p>
                <button className="text-gray-400 dark:text-white/30 text-xs font-semibold uppercase tracking-wider">View All</button>
              </div>
              <div className="flex gap-3 overflow-x-auto px-4 pb-2">
                {dishes.map((dish) => {
                  const img = dish.photo_url ?? `https://picsum.photos/seed/${dish.name.replace(/\s/g, '').toLowerCase()}/300/300`
                  return (
                    <div key={dish.id} className="flex-shrink-0 w-40 rounded-2xl overflow-hidden bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-white/5">
                      <div className="w-full h-28 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                      <div className="p-3">
                        <p className="text-gray-900 dark:text-white font-black text-[11px] uppercase leading-tight">{dish.name}</p>
                        {dish.description && (
                          <p className="text-gray-500 dark:text-white/40 text-[10px] leading-snug mt-1 line-clamp-2">{dish.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Infos pratiques ── */}
            <div className="mx-4 mt-6 grid grid-cols-4 gap-2">
              {MOCK_PRACTICAL.map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-white/5">
                  <span className="text-xl">{icon}</span>
                  <span className="text-gray-500 dark:text-white/40 text-[9px] text-center leading-tight font-medium whitespace-pre-line">{label}</span>
                </div>
              ))}
            </div>

            {/* ── Feed vidéos carousel ── */}
            {videos.length > 0 && (
              <div className="mt-8 mb-4">
                <p className="text-gray-900 dark:text-white font-black text-sm px-4 mb-3">Vidéos</p>
                <div className="flex gap-3 overflow-x-auto px-4 pb-2">
                  {videos.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setOpenVideo(p.content_url!)}
                      className="relative flex-shrink-0 w-32 h-48 rounded-2xl overflow-hidden bg-gray-200 dark:bg-neutral-900"
                    >
                      <video src={p.content_url!} className="w-full h-full object-cover" muted playsInline />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
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
        </main>

        {/* ── Sticky CTA ── */}
        <div className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-10 pt-4 bg-gradient-to-t from-white dark:from-neutral-950 to-transparent lg:left-[208px] xl:left-[240px] 2xl:left-[288px]">
          <div className="max-w-4xl mx-auto">
            <button
              className="w-full py-4 rounded-2xl font-black text-white text-sm tracking-widest uppercase active:scale-[0.98] transition-transform"
              style={{ background: '#E4002B' }}
            >
              Réserver
            </button>
          </div>
        </div>

      </div>

      {/* <div className='lg:hidden sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/80 dark:bg-black/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800'>
      <BottomNav />
     
      </div>     */}
    </>
  )
}