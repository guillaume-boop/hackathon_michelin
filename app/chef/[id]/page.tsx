'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Stars from '@/components/ui/Stars'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'

type ChefProfile = {
  id: string
  bio: string | null
  video_url: string | null
  user_id: string
  users: { id: string; username: string; avatar_url: string | null }
  restaurants: { id: string; name: string; city: string; country: string; michelin_stars: number; green_stars: boolean }
  chef_signature_dishes: Array<{ id: string; name: string; description: string | null; photo_url: string | null; order: number }>
}


function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={onClose}>
      <button className="absolute top-12 right-4 z-10 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <video src={url} className="w-full h-full object-contain" autoPlay controls playsInline onClick={e => e.stopPropagation()} />
    </div>
  )
}

export default function ChefPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const [chef, setChef] = useState<ChefProfile | null>(null)
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [openVideo, setOpenVideo] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    fetch(`/api/chefs/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setChef(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!session || !chef) return
    fetch(`/api/users/${chef.user_id}/follow`)
      .then(r => r.json())
      .then(d => setFollowing(!!d.following))
  }, [session, chef])

  const handleFollow = async () => {
    if (!session) { setShowAuthGate(true); return }
    if (!chef) return
    setFollowing(f => !f)
    await fetch(`/api/users/${chef.user_id}/follow`, { method: following ? 'DELETE' : 'POST' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-neutral-950">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !chef) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-neutral-950 gap-4">
        <span className="text-4xl">🍽️</span>
        <p className="text-white/50 text-sm">Profil introuvable</p>
        <button onClick={() => router.back()} className="text-white/30 text-sm underline">Retour</button>
        <BottomNav />
      </div>
    )
  }

  const avatarUrl = chef.users?.avatar_url ?? `https://picsum.photos/seed/${chef.users?.username}/400/400`
  const dishes = chef.chef_signature_dishes?.sort((a, b) => a.order - b.order) ?? []
  const stars = chef.restaurants?.michelin_stars ?? 0

  return (
    <>
      {openVideo && <VideoModal url={openVideo} onClose={() => setOpenVideo(null)} />}

      <div className="bg-neutral-950 min-h-screen text-white pb-28">

        {/* ── Hero avatar ──────────────────────── */}
        <div className="relative w-full" style={{ height: '52vh', minHeight: 300 }}>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${avatarUrl})` }} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-neutral-950" />

          <button
            onClick={() => router.back()}
            className="absolute top-12 left-4 z-20 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Play button — vidéo de présentation du chef */}
          {chef.video_url && (
            <button
              onClick={() => setOpenVideo(chef.video_url!)}
              className="absolute inset-0 flex items-end justify-center pb-16 z-10"
            >
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-black/50 backdrop-blur-sm border border-white/20">
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="#000" className="w-2.5 h-2.5 ml-0.5">
                    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                  </svg>
                </div>
                <span className="text-white text-xs font-semibold">Vidéo de présentation</span>
              </div>
            </button>
          )}
        </div>

        {/* ── Identité (centré) ────────────────── */}
        <div className="px-6 -mt-2 text-center">
          {/* Avatar rond flottant sur le hero */}
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-neutral-950 mx-auto -mt-10 mb-3 relative z-10 bg-neutral-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>

          <h1 className="text-2xl font-black tracking-tight">@{chef.users?.username}</h1>
          <p className="text-white/30 text-[10px] uppercase tracking-widest font-semibold mt-1">Executive Chef</p>

          {/* Bouton Suivre — inline, discret */}
          <button
            onClick={handleFollow}
            className="mt-3 px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all active:scale-95"
            style={following
              ? { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', color: 'white' }
              : { background: '#E4002B', color: 'white' }
            }
          >
            {following ? 'Suivi ✓' : '+ Suivre'}
          </button>

          {chef.bio && (
            <p className="text-white/60 text-sm leading-relaxed mt-4 max-w-xs mx-auto">{chef.bio}</p>
          )}
        </div>

        {/* ── Restaurant lié ───────────────────── */}
        {chef.restaurants && (
          <div className="mx-4 mt-5">
            <Link
              href={`/restaurant/${chef.restaurants.id}`}
              className="flex items-center gap-3 p-4 rounded-2xl bg-neutral-900 border border-white/5 active:bg-neutral-800 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-xl bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(https://picsum.photos/seed/${chef.restaurants.id.slice(0,8)}food/100/100)` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm truncate">{chef.restaurants.name}</p>
                <p className="text-white/40 text-xs mt-0.5">{chef.restaurants.city}, {chef.restaurants.country}</p>
                {(stars > 0 || chef.restaurants.green_stars) && (
                  <div className="mt-1">
                    <Stars count={stars} green={chef.restaurants.green_stars} size="xs" />
                  </div>
                )}
              </div>
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-4 h-4 opacity-20 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* ── Plats signatures ─────────────────── */}
        {dishes.length > 0 && (
          <div className="mt-7">
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-4 mb-3">Plats signatures</p>
            <div className="flex gap-3 overflow-x-auto px-4 pb-2">
              {dishes.map(dish => {
                const img = dish.photo_url ?? `https://picsum.photos/seed/${dish.name.replace(/\s/g,'').toLowerCase()}/300/300`
                return (
                  <div key={dish.id} className="flex-shrink-0 w-40 rounded-2xl overflow-hidden bg-neutral-900 border border-white/5">
                    <div className="w-full h-28 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                    <div className="p-3">
                      <p className="text-white font-black text-[11px] uppercase leading-tight">{dish.name}</p>
                      {dish.description && (
                        <p className="text-white/40 text-[10px] leading-snug mt-1 line-clamp-2">{dish.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}



      </div>

      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
      <BottomNav />
    </>
  )
}
