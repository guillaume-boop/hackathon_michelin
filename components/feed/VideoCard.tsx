'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import Stars from '@/components/ui/Stars'

type Post = {
  id: string
  restaurant_id: string
  type: string
  content_url: string | null
  likes_count: number
  created_at: string
  restaurants: { id: string; name: string; city: string; michelin_stars: number; green_stars?: boolean; description?: string }
}

interface VideoCardProps {
  post: Post
  isActive: boolean
  onLike: (postId: string) => void
  onAuthRequired: () => void
  sessionUserId?: string | null
  muted: boolean
}

export default function VideoCard({ post, isActive, onLike, onAuthRequired, sessionUserId, muted }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes_count)
  const [videoError, setVideoError] = useState(false)
  const [videoReady, setVideoReady] = useState(false)

  // Sync muted depuis le parent
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = muted
  }, [muted])

  useEffect(() => {
    const video = videoRef.current
    if (!video || videoError) return
    if (isActive) {
      video.muted = muted
      video.play().catch(() => {
        video.muted = true
        video.play().catch(() => setVideoError(true))
      })
    } else {
      video.pause()
      video.currentTime = 0
      setVideoReady(false)
    }
  }, [isActive, videoError])

  const handleLike = useCallback(() => {
    if (!sessionUserId) { onAuthRequired(); return }
    const next = !liked
    setLiked(next)
    setLikeCount(c => next ? c + 1 : c - 1)
    onLike(post.id)
  }, [liked, sessionUserId, onAuthRequired, onLike, post.id])

  const stars = post.restaurants?.michelin_stars ?? 0
  const bgGradients: Record<number, string> = {
    0: 'from-neutral-800 to-black',
    1: 'from-amber-900 to-black',
    2: 'from-red-900 to-black',
    3: 'from-red-800 to-black',
  }

  const posterSeed = post.id.replace(/-/g, '').slice(0, 8)
  const posterUrl = `https://picsum.photos/seed/${posterSeed}/400/700`

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">

      {/* Poster pendant le chargement */}
      {post.content_url && !videoError && (
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${posterUrl})` }} />
      )}
      {post.content_url && !videoError && !videoReady && (
        <div className="absolute inset-0 bg-black/40" />
      )}

      {/* Vidéo full-screen ou gradient fallback */}
      {post.content_url && !videoError ? (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${videoReady ? 'opacity-100' : 'opacity-0'}`}
          src={post.content_url}
          loop
          muted={muted}
          playsInline
          preload="auto"
          onCanPlay={() => setVideoReady(true)}
          onError={() => setVideoError(true)}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-b ${bgGradients[stars] ?? bgGradients[0]} flex items-center justify-center`}>
          <span className="text-9xl opacity-10">🍽</span>
        </div>
      )}

      {/* Gradient cinématique */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent via-40% to-black/90" />

      {/* Boutons actions — droite, centrés verticalement sur mobile / desktop */}
      <div className="absolute right-3 lg:right-4 z-20 flex flex-col items-center gap-4 bottom-28 lg:bottom-1/4">

        {/* Like */}
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className={`w-10 h-10 rounded-full backdrop-blur-sm flex items-center justify-center transition-all duration-150 active:scale-90 group-hover:scale-105 ${
            liked ? 'bg-white shadow-lg' : 'bg-black/40 border border-white/20'
          }`}>
            <svg viewBox="0 0 24 24" fill={liked ? '#E4002B' : 'none'} stroke={liked ? '#E4002B' : 'white'} strokeWidth={1.5} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </div>
          <span className="text-white text-[10px] font-semibold drop-shadow">{likeCount}</span>
        </button>

        {/* Save */}
        <button className="flex flex-col items-center gap-1 group">
          <div className="w-10 h-10 rounded-full bg-black/40  backdrop-blur-sm flex items-center justify-center active:scale-90 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
          </div>
          <span className="text-white text-[10px] font-light drop-shadow">Enregistrer</span>
        </button>

        {/* Partager */}
        <button className="flex flex-col items-center gap-1 group">
          <div className="w-10 h-10 rounded-full bg-black/40  backdrop-blur-sm flex items-center justify-center active:scale-90 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
          </div>
          <span className="text-white text-[10px] font-semibold drop-shadow">Partager</span>
        </button>

      </div>

      {/* Info overlay — bas à gauche */}
      <div
        className="absolute   left-0 right-0 bottom-0 z-10 px-4 pt-12 pb-20 lg:pb-8 bg-gradient-to-t from-black/90 via-black/40 via-50% to-transparent"
        style={{ paddingRight: '72px' }}
      >
        {/* Étoiles Michelin */}
        {(stars > 0 || post.restaurants?.green_stars) && (
          <div className="mb-2">
            <Stars count={stars} green={post.restaurants?.green_stars} variant="overlay" size="md" />
          </div>
        )}

        {/* Nom du restaurant */}
        <h2 className="text-white font-black text-base leading-tight mb-1 drop-shadow-lg">
          {post.restaurants?.name}
        </h2>

        {/* Description */}
        {post.restaurants?.description && (
          <p className="text-white/70 text-xs leading-snug mb-2 line-clamp-2">
            {post.restaurants.description.substring(0, 120)}
          </p>
        )}

        {/* Restaurant + ville */}
        <div className="flex items-center gap-2  ">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
            <div className="w-full h-full flex items-center justify-center bg-[#E4002B]">
              <span className="text-white font-bold text-[8px]">
                {(post.restaurants?.name?.[0] ?? '?').toUpperCase()}
              </span>
            </div>
          </div>
          <span className="text-white text-xs font-bold">{post.restaurants?.name}</span>
          <span className="text-white/30 text-xs">·</span>
          <span className="text-white/60 text-xs">{post.restaurants?.city}</span>
          <span className="text-white/30 text-xs">·</span>
          <span className="text-white/60 text-xs">1.2km</span>
        </div>

        {/* en savoir + */}
        <Link
          href={`/restaurant/${post.restaurant_id}`}
          className="inline-flex items-center text-blue-400 text-xs font-semibold hover:text-blue-300 transition-colors"
        >
          en savoir +
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 ml-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  )
}