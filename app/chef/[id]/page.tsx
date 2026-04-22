'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
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
  chef_signature_dishes: Array<{
    id: string
    name: string
    description: string | null
    photo_url: string | null
    order: number
  }>
}

type FeedPost = {
  id: string
  content_url: string | null
  likes_count: number
  created_at: string
  restaurants: { name: string; michelin_stars: number }
  user_id: string
}

export default function ChefPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: session } = useSession()
  const [chef, setChef] = useState<ChefProfile | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showAuthGate, setShowAuthGate] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/chefs/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setChef(data))
      .catch(() => {
        // Try fetching by user_id — when navigating from VideoCard we pass user_id
        fetch('/api/chefs')
          .then(r => r.json())
          .then((chefs: ChefProfile[]) => {
            const found = Array.isArray(chefs) ? chefs.find(c => c.user_id === id || c.id === id) : null
            if (found) setChef(found)
            else setNotFound(true)
          })
          .catch(() => setNotFound(true))
      })
      .finally(() => setLoading(false))
  }, [id])

  // Fetch posts by this user
  useEffect(() => {
    if (!chef) return
    fetch(`/api/feed?limit=20`)
      .then(r => r.json())
      .then((all: FeedPost[]) => {
        setPosts(Array.isArray(all) ? all.filter(p => p.user_id === chef.user_id) : [])
      })
  }, [chef])

  const handleFollow = async () => {
    if (!session) { setShowAuthGate(true); return }
    if (!chef) return
    setFollowing(f => !f)
    await fetch(`/api/users/${chef.user_id}/follow`, {
      method: following ? 'DELETE' : 'POST',
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound || !chef) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-black gap-4">
        <span className="text-4xl">🍽️</span>
        <p className="text-white/50">Profil introuvable</p>
        <button onClick={() => router.back()} className="text-white/30 text-sm underline">Retour</button>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-black min-h-dvh" style={{ paddingBottom: '80px' }}>

      {/* Back button */}
      <div className="pt-safe px-4 pt-3">
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/50 text-sm active:text-white transition-colors mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
          Retour
        </button>
      </div>

      {/* Profile header */}
      <div className="relative px-4 pb-6">
        <div className="absolute inset-0 h-40" style={{ background: 'linear-gradient(180deg, rgba(228,0,43,0.1) 0%, transparent 100%)' }} />
        <div className="relative flex items-start gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
            {chef.users?.avatar_url ? (
              <Image 
                src={chef.users.avatar_url} 
                alt={chef.users?.username || 'Avatar'} 
                width={80} 
                height={80} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl font-bold" style={{ background: '#E4002B' }}>
                {(chef.users?.username?.[0] ?? '?').toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h1 className="text-white font-bold text-xl">@{chef.users?.username}</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <p className="text-white/60 text-sm">{chef.restaurants?.name}</p>
                  <Stars count={chef.restaurants?.michelin_stars ?? 0} green={chef.restaurants?.green_stars} size="md" />
                </div>
                <p className="text-white/40 text-xs mt-0.5">{chef.restaurants?.city}, {chef.restaurants?.country}</p>
              </div>

              <button
                onClick={handleFollow}
                className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold active:scale-95 transition-transform"
                style={following ? { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' } : { background: '#E4002B', color: '#fff' }}
              >
                {following ? 'Suivi' : 'Suivre'}
              </button>
            </div>

            {chef.bio && (
              <p className="text-white/60 text-sm mt-3 leading-relaxed">{chef.bio}</p>
            )}
          </div>
        </div>
      </div>

      {/* Signature dishes */}
      {chef.chef_signature_dishes?.length > 0 && (
        <div className="px-4 mb-6">
          <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">Plats signatures</p>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {chef.chef_signature_dishes
              .sort((a, b) => a.order - b.order)
              .map(dish => (
                <div key={dish.id} className="flex-shrink-0 w-40 rounded-2xl overflow-hidden border border-white/10" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <div className="h-28 flex items-center justify-center" style={{ background: 'rgba(228,0,43,0.1)' }}>
                    {dish.photo_url ? (
                      <Image 
                        src={dish.photo_url} 
                        alt={dish.name} 
                        width={160} 
                        height={112} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <span className="text-4xl">🍽️</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="text-white text-xs font-semibold">{dish.name}</p>
                    {dish.description && (
                      <p className="text-white/40 text-[10px] mt-0.5 line-clamp-2">{dish.description}</p>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Posts grid */}
      {posts.length > 0 && (
        <div className="px-4">
          <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">Vidéos</p>
          <div className="grid grid-cols-3 gap-1">
            {posts.map(post => (
              <Link href="/" key={post.id}>
                <div className="relative aspect-[9/16] rounded-xl overflow-hidden flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  {post.content_url ? (
                    <video src={post.content_url} className="w-full h-full object-cover" preload="metadata" />
                  ) : (
                    <span className="text-2xl opacity-40">▶</span>
                  )}
                  <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                    <svg viewBox="0 0 24 24" fill="white" className="w-3 h-3">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                    <span className="text-white text-[9px]">{post.likes_count}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
      <BottomNav />
    </div>
  )
}