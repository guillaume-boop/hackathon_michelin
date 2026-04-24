'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import VideoCard from '@/components/feed/VideoCard'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'
import type { FeedPostWithRestaurant } from '@/types/FeedPost'

export default function FeedPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<(FeedPostWithRestaurant | null)[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filter, setFilter] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [muted, setMuted] = useState(true)
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single')
  const videoReadyMapRef = useRef<Map<number, boolean>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const gridCacheRef = useRef<HTMLDivElement>(null)
  const loaderRef = useRef<HTMLDivElement>(null) // Ref pour le loader observable

  // Queue system to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false)
  const shouldFetchMoreRef = useRef(false)
  const fetchedIndicesRef = useRef<Set<number>>(new Set()) // Track which indices have been fetched
  const pendingTimeoutsRef = useRef<Map<number, NodeJS.Timeout>>(new Map()) // Track pending fetch timeouts
  const pendingAbortControllersRef = useRef<Map<number, AbortController>>(new Map()) // Track pending fetches to abort

  const BATCH_SIZE = 5
  const GRID_ITEMS_TO_DISPLAY = 20 // Display 20 items in grid before needing to scroll for more
  const LOAD_DELAY = 200 // Small delay to avoid blocking infinite scroll but still fast
  const MIN_SCROLL_INTERVAL = 0 // No scroll throttle — change immediately

  const fetchPostAtIndex = useCallback(async (idx: number) => {
    // Don't fetch if already fetching
    if (isFetchingRef.current) return

    // Calculate batch start (round down to nearest BATCH_SIZE)
    const batchStart = Math.floor(idx / BATCH_SIZE) * BATCH_SIZE

    // Skip if we've already fetched this batch
    const allFetched = Array.from({ length: BATCH_SIZE }, (_, i) => batchStart + i)
      .every(i => fetchedIndicesRef.current.has(i))
    if (allFetched) return

    setLoadingMore(true)
    isFetchingRef.current = true

    // Create an AbortController for this fetch
    const abortController = new AbortController()
    pendingAbortControllersRef.current.set(idx, abortController)

    try {
      // Fetch batch of BATCH_SIZE posts starting from batchStart
      const res = await fetch(`/api/feed?limit=${BATCH_SIZE}&offset=${batchStart}`, {
        signal: abortController.signal
      })
      const data = await res.json()
      const newPosts = Array.isArray(data) ? data : []

      if (newPosts.length > 0) {
        setPosts(prev => {
          const updated = [...prev]
          newPosts.forEach((post, i) => {
            const postIdx = batchStart + i
            while (updated.length <= postIdx) {
              updated.push(null)
            }
            updated[postIdx] = post
          })
          return updated
        })
      }

      // Mark all indices in batch as fetched (even if empty - means we've reached end)
      for (let i = 0; i < BATCH_SIZE; i++) {
        fetchedIndicesRef.current.add(batchStart + i)
      }
    } catch (error) {
      // Only log if it's not an abort error
      if (error instanceof Error && error.name !== 'AbortError') {
        // Silently fail
      }
    } finally {
      setLoadingMore(false)
      isFetchingRef.current = false
      pendingAbortControllersRef.current.delete(idx)
    }
  }, [BATCH_SIZE])

  // Initial load: fetch first batch
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch(`/api/feed?limit=20&t=${Date.now()}`, { cache: 'no-store' })
        const data = await res.json()
        const newPosts = Array.isArray(data) ? data : []
        setPosts(newPosts)
        // Mark indices 0-19 as fetched
        newPosts.forEach((_, i) => fetchedIndicesRef.current.add(i))
        setLoading(false)
      } catch (error) {
        // Silently fail
        setLoading(false)
      }
    }
    fetchInitial()
  }, [])

  // Auto-fetch more when approaching the end of loaded posts
  useEffect(() => {
    if (viewMode === 'single' && activeIndex > 0) {
      // When user is close to the end, fetch more
      if (activeIndex > posts.length - RENDER_RANGE - 2 && posts.length < 200) {
        const nextIdx = posts.length
        if (!fetchedIndicesRef.current.has(nextIdx) && !isFetchingRef.current) {
          fetchPostAtIndex(nextIdx)
        }
      }
    }
  }, [activeIndex, viewMode, posts.length, fetchPostAtIndex])

  const filteredPosts = filter === null
    ? posts
    : filter === -1
      ? posts.filter(p => p !== null && p.restaurants?.green_stars)
      : posts.filter(p => p !== null && p.restaurants?.michelin_stars === filter)

  // Render window: only render posts within a range of active index
  // This prevents rendering 100+ videos at once
  const RENDER_RANGE = 20 // Render all initially loaded posts to ensure they're available
  const renderStart = Math.max(0, activeIndex - RENDER_RANGE)
  const renderEnd = Math.min(filteredPosts.length, activeIndex + RENDER_RANGE + 1)
  const visiblePosts = filteredPosts.slice(renderStart, renderEnd)
  const postsBeforeRender = renderStart

  // Track active card for video play/pause & handle infinite scroll
  useEffect(() => {
    const container = containerRef.current
    const gridContainer = gridCacheRef.current
    const loader = loaderRef.current
    
    if (!container || filteredPosts.length === 0) return

    // Single view: track active index and fetch if needed
    if (viewMode === 'single') {
      const scrollContainer = container.querySelector('.relative.w-full') as HTMLElement
      const items = container.querySelectorAll<HTMLElement>('.feed-item')
      let scrollTimeout: NodeJS.Timeout | null = null
      let lastActiveChangedTime = Date.now()
      
      // Capture refs into local variables for cleanup function
      const pendingTimeouts = pendingTimeoutsRef.current
      const pendingAbortControllers = pendingAbortControllersRef.current
      
      const handleWheel = (e: WheelEvent) => {
        // Block scroll only if current video is still loading
        const currentVideoReady = videoReadyMapRef.current.get(activeIndex) ?? false
        if (!currentVideoReady) {
          e.preventDefault()
        }
      }
      
      const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = parseInt((entry.target as HTMLElement).dataset.index ?? '0', 10)
            
            // Throttle: max one video change per MIN_SCROLL_INTERVAL
            // Clear any previous timeout and set a new one
            if (scrollTimeout) clearTimeout(scrollTimeout)
            
            scrollTimeout = setTimeout(() => {
              setActiveIndex(idx)
              lastActiveChangedTime = Date.now()
              
              // Cancel any pending timeouts for other indices
              pendingTimeoutsRef.current.forEach((timeout, timeoutIdx) => {
                if (timeoutIdx !== idx) {
                  clearTimeout(timeout)
                  pendingTimeoutsRef.current.delete(timeoutIdx)
                }
              })
              
              // If already fetched or fetching, skip
              if (fetchedIndicesRef.current.has(idx) || isFetchingRef.current) return
              
              // Set a timer to fetch after LOAD_DELAY
              if (pendingTimeoutsRef.current.has(idx)) {
                clearTimeout(pendingTimeoutsRef.current.get(idx)!)
              }
              
              const timeout = setTimeout(() => {
                fetchPostAtIndex(idx)
                pendingTimeoutsRef.current.delete(idx)
              }, LOAD_DELAY)
              
              pendingTimeoutsRef.current.set(idx, timeout)
            }, MIN_SCROLL_INTERVAL)
            
            break
          }
        }
      },
      { root: container, threshold: 0.7 },
    )
    items.forEach(el => observer.observe(el))
    
    // Add wheel listener to block fast scrolling (non-passive so we can preventDefault)
    if (scrollContainer) {
      scrollContainer.addEventListener('wheel', handleWheel, { passive: false })
    }
    
    // Observe the loader to trigger fetches for scrolling down
    const loaderObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isFetchingRef.current) {
          // Loader is visible - fetch more
          const nextIdx = posts.length
          if (!fetchedIndicesRef.current.has(nextIdx)) {
            setLoadingMore(true)
            fetchPostAtIndex(nextIdx)
          }
        }
      })
    }, { threshold: 0.1 })  // No root container - observe viewport
    
    // Always observe loader even if it's initially null - it might appear later
    if (loader) {
      loaderObserver.observe(loader)
    }
    
    return () => {
      observer.disconnect()
      loaderObserver.disconnect()
      if (scrollTimeout) clearTimeout(scrollTimeout)
      if (scrollContainer) {
        scrollContainer.removeEventListener('wheel', handleWheel)
      }
      // Clean up all pending timeouts when unmounting
      pendingTimeouts.forEach(timeout => clearTimeout(timeout))
      pendingTimeouts.clear()
      // Abort all pending fetches when unmounting
      pendingAbortControllers.forEach(controller => controller.abort())
      pendingAbortControllers.clear()
    }
    } else if (viewMode === 'grid' && gridContainer) {
      // Grid view: track scroll and load more at bottom
      // NO throttle for grid - just load on demand
      const handleScroll = () => {
        const scrollTop = gridContainer.scrollTop
        const scrollHeight = gridContainer.scrollHeight
        const clientHeight = gridContainer.clientHeight
        
        // Load more when user scrolls near bottom
        if (scrollHeight - (scrollTop + clientHeight) < 500) {
          // Fetch next post without any timeout
          const nextIdx = posts.length
          if (!fetchedIndicesRef.current.has(nextIdx) && !isFetchingRef.current) {
            fetchPostAtIndex(nextIdx)
          }
        }
      }
      
      gridContainer.addEventListener('scroll', handleScroll)
      return () => {
        gridContainer.removeEventListener('scroll', handleScroll)
      }
    }
  }, [filteredPosts, viewMode, fetchPostAtIndex, posts.length, MIN_SCROLL_INTERVAL, activeIndex])

  useEffect(() => {
    if (viewMode === 'single') {
      setActiveIndex(0)
    }
  }, [filter, viewMode])

  const currentPost = filteredPosts[activeIndex]

  return (
    <div className="flex h-screen bg-white dark:bg-black overflow-hidden">

      {/* ─── SIDEBAR GAUCHE (lg+) ─── */}
      <aside className="hidden lg:flex flex-col w-52 xl:w-60 2xl:w-72 shrink-0 border-r border-gray-200 dark:border-gray-800 h-full overflow-y-auto bg-white dark:bg-black p-4 xl:p-6">
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

  {/* ─── MAIN FEED ─── */}
<main className="flex-1 flex flex-col min-w-0 h-full">
  
  {/* Mobile Header */}
  <div className="lg:hidden fixed top-0 left-0 right-0 z-30 px-4 py-3  ">
    <div className="flex items-center justify-between">
      <span className="font-black text-lg text-white dark:text-white"></span>
      <div className="flex gap-2 py-8">
        <button
          onClick={() => setShowFilterPanel(!showFilterPanel)}
          className="p-2.5 rounded-full text-white  bg-white/10 backdrop-blur-sm hover:bg-black/20 dark:hover:bg-white/30 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-white dark:text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
        </button>
        <Link
          href="/decouvrir"
          className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-black/20 dark:hover:bg-white/30 transition-all"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-white dark:text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </Link>
        <button
          onClick={() => setMuted(m => !m)}
          className="p-2.5 rounded-full bg-white/10 backdrop-blur-sm hover:bg-black/20 dark:hover:bg-white/30 transition-all"
        >
          {muted ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-white dark:text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-white dark:text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  </div>

  {/* Filter Panel Mobile */}
  {showFilterPanel && (
    <div className="lg:hidden fixed inset-0 z-50 bg-black/50 dark:bg-black/80 flex items-end" onClick={() => setShowFilterPanel(false)}>
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl w-full p-4 max-h-[70vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-12 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />
        <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">Filtrer par</h3>
        <div className="space-y-2">
          {[
            { val: null, label: 'Tous' },
            { val: 1, label: '★ 1 étoile' },
            { val: 2, label: '★★ 2 étoiles' },
            { val: 3, label: '★★★ 3 étoiles' },
            { val: -1, label: '🌿 Green Star' },
          ].map(f => (
            <button
              key={String(f.val)}
              onClick={() => { setFilter(f.val); setShowFilterPanel(false) }}
              className={`w-full text-left px-4 py-3 rounded-lg font-semibold transition-colors ${
                filter === f.val
                  ? 'bg-[#E4002B]/20 text-[#E4002B] dark:bg-[#E4002B]/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )}

  {/* Desktop Header */}
  <div className="hidden lg:flex items-center justify-between px-4 xl:px-6 2xl:px-8 py-3 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20 bg-white/50 dark:bg-black/50 backdrop-blur-md">
    {/* Search Bar */}
    <div className="flex-1 max-w-md xl:max-w-lg 2xl:max-w-2xl">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          placeholder="Chercher..."
          className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:bg-white dark:focus:bg-gray-800 transition-all placeholder:text-gray-500 dark:placeholder:text-gray-500"
        />
      </div>
    </div>

    {/* Controls Right */}
    <div className="flex items-center gap-3 ml-4 xl:ml-6">
      {/* Grid/Single Toggle (2xl) */}
      <div className="hidden 2xl:flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
        <button
          onClick={() => setViewMode('single')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            viewMode === 'single'
              ? 'bg-white dark:bg-gray-700 text-[#E4002B] font-semibold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title="Vue simple"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        </button>
        <button
          onClick={() => setViewMode('grid')}
          className={`px-3 py-1.5 rounded-md transition-all ${
            viewMode === 'grid'
              ? 'bg-white dark:bg-gray-700 text-[#E4002B] font-semibold'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
          title="Vue grille"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        </button>
      </div>

      {/* Sound */}
      <button
        onClick={() => setMuted(m => !m)}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
      >
        {muted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-700 dark:text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-700 dark:text-gray-300">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
          </svg>
        )}
      </button>

      {/* Profile Summary Desktop */}
      {session ? (
        <div className="flex items-center gap-2">
          <Link
            href="/profil"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700">
              {session.user?.image ? (
                <Image src={session.user.image} alt="Avatar" width={24} height={24} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                  {session.user?.email?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-sm font-semibold hidden xl:block text-gray-700 dark:text-gray-300">{session.user?.name?.split(' ')[0] || 'Profil'}</span>
          </Link>
        </div>
      ) : (
        <Link
          href="/login"
          className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-[#E4002B] hover:opacity-90 transition-opacity"
        >
          Connexion
        </Link>
      )}
    </div>
  </div>

  {/* Feed Content - Reduced width on desktop */}
  <div className="flex-1 flex items-center justify-center relative overflow-hidden lg:pt-0">
    {viewMode === 'single' ? (
      <>
        {/* Single View - Centered with reduced width on desktop */}
        <div
          ref={containerRef}
          className="relative bg-white dark:bg-black overflow-hidden h-full w-full flex justify-center"
          style={{ height: '100dvh' }}
        >
          {/* Container with max-width for desktop */}
          <div className="relative w-full lg:max-w-[380px] xl:max-w-[420px] 2xl:max-w-[480px] h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-2 border-gray-300 dark:border-white/20 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-16 h-16 text-gray-400 dark:text-white/30">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                </svg>
                <p className="text-gray-500 dark:text-white/60">Aucun contenu</p>
              </div>
            ) : (
              <>
                <div className="relative w-full h-full overflow-y-scroll snap-y snap-mandatory" style={{ scrollbarWidth: 'none', scrollBehavior: 'smooth' }}>
                  {/* Spacer before visible range */}
                  {postsBeforeRender > 0 && (
                    <div className="h-[100dvh]" />
                  )}
                  
                  {/* Rendered posts (only visible window) */}
                  {visiblePosts.filter(p => p !== null).map((post, i) => {
                    const idx = renderStart + i
                    return (
                    <div key={post.id} className="feed-item snap-start" data-index={idx} style={{ height: '100dvh' }}>
                      <VideoCard
                        post={post}
                        isActive={idx === activeIndex}
                        muted={muted}
                        onAuthRequired={() => setShowAuthGate(true)}
                        sessionUserId={session?.user?.id}
                        onReadyChange={(ready) => { videoReadyMapRef.current.set(idx, ready) }}
                      />
                    </div>
                    )
                  })}
                  
                  {/* Spacer after visible range */}
                  {renderEnd < filteredPosts.length && (
                    <div style={{ height: `${(filteredPosts.length - renderEnd) * 100}dvh` }} />
                  )}
                  
                  {/* Loader - always have extra space so it's always scrollable */}
                  <div ref={loaderRef} style={{ minHeight: '200dvh' }} className="flex items-center justify-center py-20">
                    {loadingMore && (
                      <div className="w-8 h-8 border-2 border-gray-300 dark:border-white/20 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
                    )}
                  </div>
                </div>
                
                {/* Pagination Dots */}
                {filteredPosts.length > 1 && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10 pointer-events-none">
                    {filteredPosts.slice(Math.max(0, activeIndex - 3), activeIndex + 4).map((_, idx) => {
                      const realIdx = Math.max(0, activeIndex - 3) + idx
                      return (
                        <div
                          key={realIdx}
                          className={`rounded-full transition-all duration-300 ${
                            realIdx === activeIndex ? 'w-1.5 h-4 bg-gray-900 dark:bg-white' : 'w-1.5 h-1.5 bg-gray-400 dark:bg-white/30'
                          }`}
                        />
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </>
    ) : (
      /* Grid View (2xl+) */
      <div ref={gridCacheRef} className="w-full h-full overflow-y-auto p-4 xl:p-6 2xl:p-8 bg-white dark:bg-black">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-10 h-10 border-2 border-gray-300 dark:border-white/20 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-16 h-16 text-gray-400 dark:text-white/30">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0 0 12.016 15a4.486 4.486 0 0 0-3.198 1.318M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
            </svg>
            <p className="text-gray-500 dark:text-white/60">Aucun contenu</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 xl:gap-6 auto-rows-max max-w-[1600px] mx-auto">
              {filteredPosts.filter(p => p !== null).map((post, i) => (
                <div key={post.id} className="h-[500px] xl:h-[600px] 2xl:h-[650px] rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
                  <VideoCard
                    post={post}
                    isActive={true}
                    muted={muted}
                    onAuthRequired={() => setShowAuthGate(true)}
                    sessionUserId={session?.user?.id}
                    onReadyChange={() => {}}
                  />
                </div>
              ))}
            </div>
            
            {loadingMore && (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-2 border-gray-300 dark:border-white/20 border-t-gray-900 dark:border-t-white rounded-full animate-spin" />
              </div>
            )}
          </>
        )}
      </div>
    )}
  </div>
</main>

      {/* ─── SIDEBAR DROITE (xl+) ─── */}
      <aside className="hidden xl:flex flex-col w-72 2xl:w-80 shrink-0 border-l border-gray-200 dark:border-gray-800 h-full overflow-y-auto bg-white dark:bg-black p-5">
        {currentPost && viewMode === 'single' && (
          <>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">En cours</p>

            {/* Thumbnail */}
            <div className="w-full aspect-[9/16] max-h-56 2xl:max-h-64 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 mb-4 relative">
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

            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{currentPost.restaurants?.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1 mb-4">{currentPost.restaurants?.city}</p>

            <div className="flex items-center gap-2 flex-wrap mb-5">
              <div className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" fill="#E4002B" className="w-4 h-4">
                  <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                </svg>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{currentPost.likes_count}</span>
              </div>
            </div>

            <Link
              href={`/restaurant/${currentPost.id}`}
              className="flex w-full items-center justify-center py-3 rounded-lg text-sm font-bold text-white bg-[#E4002B] hover:opacity-90 transition-opacity"
            >
              Voir le restaurant
            </Link>
          </>
        )}
      </aside>

      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
      <BottomNav />

      <style jsx global>{`
        .feed-container {
          height: 100dvh;
          width: 100%;
          overflow-y-scroll;
          scroll-snap-type: y mandatory;
          scroll-behavior: smooth;
        }

        .feed-container::-webkit-scrollbar {
          display: none;
        }

        .feed-item {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }

        @supports (height: 100dvh) {
          .feed-container {
            height: 100dvh;
          }
        }
      `}</style>
    </div>
  )
}