'use client'

import { useEffect, useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import BottomNav from '@/components/layout/BottomNav'

type Restaurant = {
  id: string
  name: string
  city: string
  michelin_stars: number
  green_stars: boolean
  lat: number
  lng: number
}

type FilterOption = {
  id: string
  label: string
  icon: React.ReactNode
  filter: (r: Restaurant) => boolean
}

function markerColor(stars: number, green: boolean) {
  if (green && stars === 0) return '#4ade80'
  if (stars >= 3) return '#E4002B'
  if (stars === 2) return '#f97316'
  return '#facc15'
}

export default function MapClient({ restaurantId }: { restaurantId?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const restaurantIdRef = useRef(restaurantId)

  // Load restaurants
  useEffect(() => {
    fetch('/api/restaurants')
      .then(r => r.json())
      .then((data: Restaurant[]) => setRestaurants(data))
  }, [])

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl

    const map = L.map(containerRef.current, { center: [46, 8], zoom: 4, zoomControl: false })
    mapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CartoDB',
      maxZoom: 19,
    }).addTo(map)

    // Cluster group
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cluster = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 50,
      iconCreateFunction: (c: { getChildCount: () => number }) => {
        const count = c.getChildCount()
        return L.divIcon({
          html: `<div style="
            width:40px;height:40px;border-radius:50%;
            background:#E4002B;border:3px solid white;
            display:flex;align-items:center;justify-content:center;
            font-weight:900;font-size:13px;color:white;
            box-shadow:0 2px 8px rgba(0,0,0,0.5);
          ">${count}</div>`,
          className: '',
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        })
      },
    })

    fetch('/api/restaurants')
      .then(r => r.json())
      .then((restaurants: Restaurant[]) => {
        const currentMap = mapRef.current
        if (!currentMap) return

        restaurants.forEach((r) => {
          if (!r.lat || !r.lng) return
          const color = markerColor(r.michelin_stars, r.green_stars)
          const label = r.michelin_stars > 0 ? '★'.repeat(r.michelin_stars) : '🌿'
          const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
            <circle cx="18" cy="18" r="16" fill="${color}" stroke="white" stroke-width="2.5"/>
            <text x="18" y="23" text-anchor="middle" font-size="11" font-weight="bold" fill="white">${label}</text>
            <polygon points="11,32 25,32 18,44" fill="${color}"/>
          </svg>`

          const icon = L.divIcon({ html: svg, className: '', iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -46] })

          const greenBadge = r.green_stars
            ? `<span style="background:#4ade80;color:#000;font-size:9px;font-weight:700;padding:1px 6px;border-radius:999px;margin-left:4px;">🌿</span>`
            : ''

          const marker = L.marker([r.lat, r.lng], { icon })
          marker.bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <div style="font-weight:900;font-size:13px;line-height:1.3;margin-bottom:2px">${r.name}</div>
              <div style="font-size:11px;color:#888;margin-bottom:6px">${r.city}</div>
              <div style="display:flex;align-items:center;margin-bottom:10px">
                <span style="color:${color};font-size:14px">${'★'.repeat(r.michelin_stars)}</span>
                ${greenBadge}
              </div>
              <a href="/restaurant/${r.id}"
                style="display:inline-block;background:#E4002B;color:white;font-size:11px;font-weight:700;padding:5px 14px;border-radius:999px;text-decoration:none;">
                Voir
              </a>
            </div>
          `)

          cluster.addLayer(marker)

          if (restaurantIdRef.current && r.id === restaurantIdRef.current) {
            setTimeout(() => {
              currentMap.setView([r.lat, r.lng], 15)
              marker.openPopup()
            }, 300)
          }
        })

        if (mapRef.current) currentMap.addLayer(cluster)
      })

    return () => {
      mapRef.current = null
      clusterRef.current = null
      try { map.remove() } catch { /* already removed */ }
    }
  }, [])

  // Update markers when filter changes
  useEffect(() => {
    if (!mapRef.current || !clusterRef.current || restaurants.length === 0) return

    // Clear existing markers
    clusterRef.current.clearLayers()

    // Apply filter
    const currentFilter = STATIC_FILTERS.find(f => f.id === activeFilter)?.filter || (() => true)
    const searchLower = searchQuery.toLowerCase()
    
    const filteredRestaurants = restaurants.filter(r => {
      const matchFilter = currentFilter(r)
      const matchSearch = searchQuery === '' || 
        r.name.toLowerCase().includes(searchLower) ||
        r.city.toLowerCase().includes(searchLower)
      return matchFilter && matchSearch && r.lat && r.lng
    })

    filteredRestaurants.forEach((r) => {
      const color = markerColor(r.michelin_stars, r.green_stars)
      const label = r.michelin_stars > 0 ? '★'.repeat(r.michelin_stars) : '🌿'
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
        <circle cx="18" cy="18" r="16" fill="${color}" stroke="white" stroke-width="2.5"/>
        <text x="18" y="23" text-anchor="middle" font-size="11" font-weight="bold" fill="white">${label}</text>
        <polygon points="11,32 25,32 18,44" fill="${color}"/>
      </svg>`

      const icon = L.divIcon({ html: svg, className: '', iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -46] })

      const greenBadge = r.green_stars
        ? `<span style="background:#4ade80;color:#000;font-size:9px;font-weight:700;padding:1px 6px;border-radius:999px;margin-left:4px;">🌿</span>`
        : ''

      const marker = L.marker([r.lat, r.lng], { icon }).bindPopup(`
        <div style="font-family:sans-serif;min-width:160px">
          <div style="font-weight:900;font-size:13px;line-height:1.3;margin-bottom:2px">${r.name}</div>
          <div style="font-size:11px;color:#888;margin-bottom:6px">${r.city}</div>
          <div style="display:flex;align-items:center;margin-bottom:10px">
            <span style="color:${color};font-size:14px">${'★'.repeat(r.michelin_stars)}</span>
            ${greenBadge}
          </div>
          <a href="/restaurant/${r.id}"
            style="display:inline-block;background:#E4002B;color:white;font-size:11px;font-weight:700;padding:5px 14px;border-radius:999px;text-decoration:none;">
            Voir
          </a>
        </div>
      `)

      // Vérification que clusterRef.current n'est pas null avant d'ajouter le marker
      if (clusterRef.current) {
        clusterRef.current.addLayer(marker)
      }
    })

    // Fit bounds to show all markers
    if (filteredRestaurants.length > 0 && mapRef.current) {
      const bounds = L.latLngBounds(filteredRestaurants.map(r => [r.lat, r.lng]))
      mapRef.current.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [restaurants, activeFilter, searchQuery])

  const filteredCount = restaurants.filter(r => {
    const currentFilter = STATIC_FILTERS.find(f => f.id === activeFilter)?.filter || (() => true)
    const searchLower = searchQuery.toLowerCase()
    return currentFilter(r) && (searchQuery === '' || 
      r.name.toLowerCase().includes(searchLower) ||
      r.city.toLowerCase().includes(searchLower)) && r.lat && r.lng
  }).length

  return (
    <div className="flex h-screen bg-white dark:bg-black">

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
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.954c.44-.44 1.152-.44 1.592 0L21.75 12M4.5 10.5v6.75a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V10.5m-9 7.5v-4.5h3v4.5" />
                </svg>
              )
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
              icon: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
              )
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
      <div className="flex-1 flex flex-col h-full relative">
        
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-30 px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
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

        {/* Filter Bar - AU-DESSUS de la carte */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-16 lg:pt-4 pointer-events-none">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            {/* Search Bar */}
            <div className="flex gap-2 mb-3">
              <div className="flex-1 flex items-center gap-2 bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-gray-500 dark:text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un restaurant ou une ville..."
                  className="flex-1 bg-transparent text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Filter button mobile */}
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="lg:hidden flex items-center gap-2 bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-700 shadow-lg"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 text-gray-900 dark:text-white">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
                </svg>
              </button>
            </div>

            {/* Filter Chips - Desktop */}
            <div className="hidden lg:flex gap-2 flex-wrap">
              {STATIC_FILTERS.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    activeFilter === filter.id
                      ? 'bg-[#E4002B] text-white shadow-lg'
                      : 'bg-white/90 dark:bg-black/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-white dark:hover:bg-black'
                  }`}
                >
                  {filter.icon}
                  <span>{filter.label}</span>
                </button>
              ))}
              <div className="ml-auto text-xs text-gray-500 dark:text-gray-400 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
                {filteredCount} restaurant{filteredCount > 1 ? 's' : ''}
              </div>
            </div>

            {/* Filter Panel - Mobile */}
            {isFilterOpen && (
              <div className="lg:hidden mt-2 bg-white/95 dark:bg-black/95 backdrop-blur-md rounded-xl p-3 border border-gray-200 dark:border-gray-700 shadow-xl">
                <div className="flex flex-wrap gap-2">
                  {STATIC_FILTERS.map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => {
                        setActiveFilter(filter.id)
                        setIsFilterOpen(false)
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        activeFilter === filter.id
                          ? 'bg-[#E4002B] text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {filter.icon}
                      <span>{filter.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Chips - Mobile (inline) */}
            <div className="flex lg:hidden gap-2 flex-wrap mt-2">
              {STATIC_FILTERS.slice(0, 4).map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setActiveFilter(filter.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    activeFilter === filter.id
                      ? 'bg-[#E4002B] text-white'
                      : 'bg-white/90 dark:bg-black/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {filter.icon}
                  <span>{filter.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Map - prend tout l'espace restant */}
        <div ref={containerRef} className="w-full h-full" />
      </div>

      <BottomNav />
    </div>
  )
}