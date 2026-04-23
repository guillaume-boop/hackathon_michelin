'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Stars from '@/components/ui/Stars'

type FriendRating = {
  userId: string
  username: string
  avatar_url: string | null
  rating: number
}

type Restaurant = {
  id: string
  name: string
  city: string
  country: string
  michelin_stars?: number
  green_stars?: boolean
  description?: string
  dietary_option?: string | null
  facilities?: string[]
  website_url?: string
  michelin_url?: string
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

const MOCK_CUISINE: Record<number, string> = {
  0: 'Cuisine de Saison',
  1: 'Gastronomie Française',
  2: 'Haute Gastronomie · Menu Dégustation',
  3: 'Grande Gastronomie',
}


const FACILITY_ICONS: Record<string, string> = {
  'Terrasse': '🌿',
  'Bar': '🍸',
  'Cave à vins': '🍷',
  'Parking': '🅿️',
  'Réservation requise': '📅',
  'Menu dégustation': '🍽',
  'Cuisine ouverte': '👨‍🍳',
  'Menu du marché': '🥕',
  'Ambiance décontractée': '😊',
  'Service traiteur': '🎉',
  'Climatisation': '❄️',
  'Menu découverte': '✨',
  'Ambiance chic': '✨',
  'Service attentif': '👋',
  'Comptoir sushi': '🍣',
  'Parking accessible': '♿',
  'Concierge': '🔔',
  'Service valet': '🚗',
  'Terrasse vue mer': '🌊',
  'Spa': '💆',
  'Bar à huître': '🦪',
  'Terrasse vue montagne': '⛰️',
  'Vue campagne': '🌾',
  'WiFi gratuit': '📶',
  'Service privé': '👑',
  'Service conseil': '💡',
  'Accessible PMR': '♿',
  'Chaise haute pour enfants': '👶',
}

const MOCK_DISHES = [
  { id: 'm1', name: 'Amuse Bouche', description: 'Smoked oyster pearl, caviar, algue marine', photo_url: 'https://picsum.photos/seed/amuse/300/300', order: 1 },
  { id: 'm2', name: 'Foie Gras', description: 'Torchon, brioche maison, chutney de figues', photo_url: 'https://picsum.photos/seed/foiegras/300/300', order: 2 },
  { id: 'm3', name: 'Homard Bleu', description: 'Beurre nantais, émulsion de corail', photo_url: 'https://picsum.photos/seed/homard/300/300', order: 3 },
  { id: 'm4', name: 'Wagyu A5', description: 'Jus corsé, truffe noire, pomme soufflée', photo_url: 'https://picsum.photos/seed/wagyu/300/300', order: 4 },
  { id: 'm5', name: 'Soufflé', description: 'Grand Marnier, glace vanille Madagascar', photo_url: 'https://picsum.photos/seed/souffle/300/300', order: 5 },
]

function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={onClose}>
      <button className="absolute top-12 right-4 z-10 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <video src={url} className="w-full h-full object-contain" autoPlay controls playsInline onClick={(e) => e.stopPropagation()} />
    </div>
  )
}

export default function RestaurantPageClient({ restaurant, chefs, posts, menuDishes }: {
  restaurant: Restaurant
  chefs: Chef[]
  posts: Post[]
  menuDishes: Dish[]
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const [liked, setLiked] = useState(false)
  const [openVideo, setOpenVideo] = useState<string | null>(null)
  const [isLight, setIsLight] = useState(false)
  const [friendRatings, setFriendRatings] = useState<FriendRating[]>([])

  useEffect(() => {
    const uid = (session?.user as { id?: string })?.id
    if (!uid) return
    Promise.all([
      fetch(`/api/users/${uid}/following`).then(r => r.json()),
      fetch(`/api/experiences?restaurant_id=${restaurant.id}`).then(r => r.json()),
    ]).then(([following, experiences]) => {
      const followingList = Array.isArray(following) ? following : []
      const expList = Array.isArray(experiences) ? experiences : []
      const friendMap = new Map<string, { username: string; avatar_url: string | null }>(
        followingList.map((f: { followee_id: string; users: { username: string; avatar_url: string | null } | { username: string; avatar_url: string | null }[] }) => {
          const u = Array.isArray(f.users) ? f.users[0] : f.users
          return [f.followee_id, { username: u?.username ?? '', avatar_url: u?.avatar_url ?? null }]
        })
      )
      // expList is ordered by visited_at DESC — first occurrence per user = most recent
      const seen = new Set<string>()
      const ratings: FriendRating[] = expList
        .filter((e: { user_id: string }) => {
          if (!friendMap.has(e.user_id) || seen.has(e.user_id)) return false
          seen.add(e.user_id)
          return true
        })
        .map((e: { user_id: string; rating: number }) => ({
          userId: e.user_id,
          username: friendMap.get(e.user_id)!.username,
          avatar_url: friendMap.get(e.user_id)!.avatar_url,
          rating: e.rating,
        }))
      setFriendRatings(ratings)
    }).catch(() => {})
  }, [session, restaurant.id])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    setIsLight(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsLight(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const stars = restaurant.michelin_stars ?? 0
  const seed = restaurant.id.replace(/-/g, '').slice(0, 8)
  const heroImg = `https://picsum.photos/seed/${seed}food/900/600`
  const cuisine = MOCK_CUISINE[stars] ?? MOCK_CUISINE[0]
  const dishes = menuDishes.length > 0 ? menuDishes : MOCK_DISHES
  const videos = posts.filter(p => p.content_url)
  const heroVideo = videos.length > 0 ? videos[Math.floor(Math.random() * videos.length)] : null

  const bg = isLight ? 'bg-[#F5F5F5]' : 'bg-neutral-950'
  const cardBg = isLight ? 'bg-white border-black/[0.07]' : 'bg-neutral-900 border-white/5'
  const title = isLight ? 'text-[#262626]' : 'text-white'
  const sub = isLight ? 'text-black/40' : 'text-white/40'
  const sectionTitle = `font-bold text-sm ${isLight ? 'text-[#262626]' : 'text-white'}`
  const bodyText = `text-xs font-normal ${isLight ? 'text-[#262626]' : 'text-[#B1B1B1]'}`

  return (
    <>
      {openVideo && <VideoModal url={openVideo} onClose={() => setOpenVideo(null)} />}

      <div className={`${bg} min-h-screen pb-32`}>

        {/* ── Hero ─────────────────────────────── */}
        <div className="relative w-full" style={{ height: '65vh', minHeight: 400 }}>
          {heroVideo ? (
            <video
              src={heroVideo.content_url!}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay muted loop playsInline
            />
          ) : (
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${heroImg})` }} />
          )}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(228,0,43,0.15) 50%, rgba(228,0,43,0.85) 100%)' }} />

          <button
            onClick={() => router.back()}
            className="absolute top-12 left-4 z-10 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: '#E4002B' }}
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

        {/* ── Identité ─────────────────────────── */}
        <div className="px-4 pt-5 text-center">
          <h1 className={`text-3xl font-black tracking-tight leading-tight uppercase ${title}`}>{restaurant.name}</h1>
          <p className="text-xl font-semibold mt-1.5 mb-4" style={{ color: '#E4002B' }}>{cuisine}</p>
          {(stars > 0 || restaurant.green_stars) && (
            <div className="flex items-center justify-center mb-4">
              <Stars count={stars} green={restaurant.green_stars} size="md" />
            </div>
          )}
          {restaurant.description && (
            <p className={`text-sm leading-relaxed mb-6 ${isLight ? 'text-black/60' : 'text-white/60'}`}>{restaurant.description}</p>
          )}
        </div>

        {/* ── Ville / Pays ─────────────────────── */}
        <div className="flex flex-col items-center mt-1 gap-1">
          <Link
            href={`/map?restaurant=${restaurant.id}`}
            className="w-8 h-8 rounded-full flex items-center justify-center active:opacity-60 transition-opacity"
            style={{ background: 'rgba(228,0,43,0.12)' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="#E4002B" strokeWidth={1.8} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </Link>
          <p className="text-sm font-semibold" style={{ color: '#B1B1B1' }}>
            {restaurant.city}, {restaurant.country}
          </p>
        </div>

        {/* ── Note amis ────────────────────────── */}
        {friendRatings.length > 0 && (() => {
          const avg = friendRatings.reduce((s, f) => s + f.rating, 0) / friendRatings.length
          return (
            <div className={`mx-4 mt-5 p-4 rounded-2xl border flex items-center gap-3 ${cardBg}`}>
              <div className="flex -space-x-2 flex-shrink-0">
                {friendRatings.slice(0, 3).map(f => (
                  <div key={f.userId} className="w-8 h-8 rounded-full overflow-hidden border-2 border-white bg-neutral-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.avatar_url ?? `https://picsum.photos/seed/${f.username}/80/80`} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-semibold ${title}`}>
                  {friendRatings.length === 1
                    ? `${friendRatings[0].username} a noté ce restaurant`
                    : `${friendRatings.length} amis ont noté ce restaurant`}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Stars count={Math.round(avg)} size="xs" />
                  <span className={`text-xs font-bold ${title}`}>{avg.toFixed(1)}</span>
                  <span className={`text-xs ${sub}`}>/ 5</span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── Petits plus ─────────────────────── */}
        {(() => {
          const facilitiesArray = restaurant.facilities ?? []
          return facilitiesArray.length > 0 ? (
            <div className="mx-4 mt-8">
              <p className={`${sectionTitle} mb-3`}>Petits plus :</p>
              <div className="grid grid-cols-4 gap-2">
                {facilitiesArray.map((facility) => (
                  <div key={facility} className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border ${cardBg}`}>
                    <span className="text-xl">{FACILITY_ICONS[facility] ?? '✨'}</span>
                    <span className={`text-[10px] text-center leading-tight font-normal ${sub}`}>{facility}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        })()}

        {/* ── Chefs ─────────────────────────────── */}
        {chefs.length > 0 && (
          <div className="mt-8 px-4">
            <p className={`${sectionTitle} mb-4`}>Chef</p>
            <div className="flex flex-col gap-3">
              {chefs.map((chef) => {
                const avatarSeed = chef.users?.username ?? chef.id.slice(0, 6)
                const avatarUrl = chef.users?.avatar_url ?? `https://picsum.photos/seed/${avatarSeed}/200/200`
                return (
                  <Link
                    key={chef.id}
                    href={`/chef/${chef.id}`}
                    className="flex items-center gap-4 p-5 rounded-2xl active:opacity-90 transition-opacity"
                    style={{ background: '#E4002B' }}
                  >
                    {/* Texte gauche */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <p className="text-white font-black text-xl leading-tight">
                        {chef.users?.username ?? 'Chef'}
                      </p>
                      {chef.bio && (
                        <p className="text-white text-xs italic leading-relaxed line-clamp-3">
                          &ldquo;{chef.bio}&rdquo;
                        </p>
                      )}
                      <span className="self-start mt-1 px-4 py-1.5 rounded-full text-xs font-semibold bg-white" style={{ color: '#666' }}>
                        Voir
                      </span>
                    </div>
                    {/* Photo droite */}
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/30 flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Menu carousel ──────────────────────── */}
        <div className="mt-8">
          <div className="flex items-center justify-between px-4 mb-3">
            <p className={sectionTitle}>À la carte</p>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2">
            {dishes.map((dish) => {
              const img = dish.photo_url ?? `https://picsum.photos/seed/${dish.name.replace(/\s/g, '').toLowerCase()}/300/300`
              return (
                <div key={dish.id} className={`flex-shrink-0 w-40 rounded-2xl overflow-hidden border ${cardBg}`}>
                  <div className="w-full h-28 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                  <div className="p-3">
                    <p className={`font-bold text-sm leading-tight ${title}`}>{dish.name}</p>
                    {dish.description && (
                      <p className={`${bodyText} leading-snug mt-1 line-clamp-2`}>{dish.description}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Feed vidéos ───────────────────────── */}
        {videos.length > 0 && (
          <div className="mt-8">
            <p className={`${sectionTitle} px-4 mb-3`}>Vidéos</p>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2">
              {videos.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setOpenVideo(p.content_url!)}
                  className="relative flex-shrink-0 w-32 h-48 rounded-2xl overflow-hidden bg-neutral-900"
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

        {/* ── Sticky CTA ─────────────────────────── */}
        <div className={`fixed bottom-0 left-0 right-0 z-30 px-4 pb-10 pt-4 bg-gradient-to-t ${isLight ? 'from-[#F5F5F5]' : 'from-neutral-950'} to-transparent`}>
          <button
            onClick={() => {
              const url = restaurant.website_url || restaurant.michelin_url
              if (url) window.open(url, '_blank')
            }}
            className="w-full py-4 rounded-2xl font-black text-white text-sm tracking-widest uppercase active:scale-[0.98] transition-transform"
            style={{ background: '#E4002B' }}
          >
            Réserver
          </button>
        </div>

      </div>
    </>
  )
}
