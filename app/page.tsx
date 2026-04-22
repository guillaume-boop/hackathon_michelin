'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import VideoCard from '@/components/feed/VideoCard'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'
import type { FeedPostWithRestaurant } from '@/types/FeedPost'

export default function FeedPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<FeedPostWithRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [muted, setMuted] = useState(true)
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

  // Track active card for video play/pause
  useEffect(() => {
    const container = containerRef.current
    if (!container || filteredPosts.length === 0) return

    const items = container.querySelectorAll<HTMLElement>('.feed-item')
    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = parseInt((entry.target as HTMLElement).dataset.index ?? '0', 10)
            setActiveIndex(idx)
            break
          }
        }
      },
      { root: container, threshold: 0.7 },
    )
    items.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [filteredPosts])

  return (
    <div className="relative bg-black overflow-hidden" style={{ height: '100dvh' }}>

      {/* Header with controls — no logo */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe">
        <div className="flex items-center justify-end gap-3 px-4 pt-8 pb-3">

          {/* Filter button + dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-3 rounded-full backdrop-blur-sm transition-colors ${showFilterPanel ? 'bg-white text-black' : 'bg-black/40 hover:bg-black/60'}`}
              title="Filtre"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke={showFilterPanel ? 'black' : 'white'} strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
            </button>

            {showFilterPanel && (
              <div className="absolute right-0 top-full mt-2 bg-black/80 backdrop-blur-xl rounded-2xl p-2 flex flex-col gap-1 min-w-[130px] border border-white/10 shadow-xl">
                {[
                  { label: '★ 1 étoile', value: 1 },
                  { label: '★★ 2 étoiles', value: 2 },
                  { label: '★★★ 3 étoiles', value: 3 },
                  { label: '🌿 Green', value: -1 },
                ].map(({ label, value }) => (
                  <button
                    key={String(value)}
                    onClick={() => { setFilter(filter === value ? null : value); setShowFilterPanel(false) }}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all ${
                      filter === value ? 'bg-white text-black' : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search button */}
          <Link href="/decouvrir" className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors" title="Recherche">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </Link>

          {/* Sound button */}
          <button onClick={() => setMuted(m => !m)} className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors" title="Son">
            {muted ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Snap-scroll feed */}
      <div ref={containerRef} className="feed-container">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
            <span className="text-5xl">🍽️</span>
            <p className="text-white/60 text-sm leading-relaxed">
              Aucun contenu pour cette sélection.<br />Lance le script de seed pour populer la base.
            </p>
          </div>
        ) : (
          filteredPosts.map((post, i) => (
            <div key={post.id} className="feed-item" data-index={i}>
              <VideoCard
                post={post}
                isActive={i === activeIndex}
                muted={muted}
                onAuthRequired={() => setShowAuthGate(true)}
                sessionUserId={session?.user?.id}
              />
            </div>
          ))
        )}
      </div>

      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
      <BottomNav />
    </div>
  )
}
