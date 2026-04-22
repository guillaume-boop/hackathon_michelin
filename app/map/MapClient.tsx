'use client'

import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
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

function markerColor(stars: number, green: boolean) {
  if (green && stars === 0) return '#4ade80'
  if (stars >= 3) return '#E4002B'
  if (stars === 2) return '#f97316'
  return '#facc15'
}

// Fonction pour générer l'icône du marqueur avec l'étoile Michelin
function createCustomIcon(stars: number, green: boolean) {
  const color = markerColor(stars, green)
  
  // Utiliser des étoiles unicode au lieu de SVG
  const starElements = '★'.repeat(stars)
  const label = stars > 0 ? starElements : '🌿'
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
    <circle cx="18" cy="18" r="16" fill="${color}" stroke="white" stroke-width="2.5"/>
    <text x="18" y="23" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${label}</text>
    <polygon points="11,32 25,32 18,44" fill="${color}"/>
  </svg>`

  return L.divIcon({ html: svg, className: '', iconSize: [36, 44], iconAnchor: [18, 44], popupAnchor: [0, -46] })
}

export default function MapClient() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (L.Icon.Default.prototype as any)._getIconUrl

    const map = L.map(containerRef.current, { center: [46, 8], zoom: 4, zoomControl: false })
    mapRef.current = map

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
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
          
          const icon = createCustomIcon(r.michelin_stars, r.green_stars)
          
          const greenBadge = r.green_stars
            ? `<span style="background:#4ade80;color:#000;font-size:9px;font-weight:700;padding:1px 6px;border-radius:999px;margin-left:4px;">🌿 Green</span>`
            : ''

          // Générer les étoiles pour le popup
          const starSvgUrl = '/icons/etoile-michelin.svg'
          const starsHtml = Array.from({ length: r.michelin_stars }).map(() => 
            `<img class="brightness-0 invert" src="${starSvgUrl}" style="width:12px;height:12px;margin:0 1px;display:inline-block;" />`
          ).join('')

          const marker = L.marker([r.lat, r.lng], { icon }).bindPopup(`
            <div style="font-family:system-ui,sans-serif;min-width:180px;border-radius:12px;">
              <div style="font-weight:900;font-size:14px;line-height:1.3;margin-bottom:4px;color:#1a1a1a;">${r.name}</div>
              <div style="font-size:11px;color:#666;margin-bottom:8px;"> ${r.city}</div>
              <div style="display:flex;align-items:center;margin-bottom:12px;gap:4px;flex-wrap:wrap;">
                <div style="display:flex;align-items:center;gap:2px;">${starsHtml}</div>
                ${greenBadge}
              </div>
              <a href="/restaurant/${r.id}"
                style="display:inline-block;background:#E4002B;color:white;font-size:12px;font-weight:700;padding:6px 16px;border-radius:999px;text-decoration:none;transition:opacity 0.2s;">
                Voir le restaurant
              </a>
            </div>
          `)

          cluster.addLayer(marker)
        })

        if (mapRef.current) currentMap.addLayer(cluster)
      })

    return () => {
      mapRef.current = null
      try { map.remove() } catch { /* already removed */ }
    }
  }, [])

  return (
    <div className="min-h-dvh bg-white dark:bg-black">
      <div className="flex">
        {/* Sidebar gauche - Navigation (visible seulement sur desktop) */}
        <aside className="hidden lg:flex lg:flex-col lg:w-[240px] xl:w-[260px] h-screen sticky top-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black z-20">
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

        {/* Contenu principal - Map */}
        <main className="flex-1 min-w-0 relative">
          {/* Header desktop avec recherche */}
          <div className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-md">
            <div className="flex-1 max-w-xl mx-auto">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                </svg>
                <input type="text" placeholder="Rechercher un restaurant..." className="w-full pl-10 placeholder:text-gray-500 dark:placeholder:text-gray-400 pr-4 py-2.5 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#E4002B] focus:bg-white dark:focus:bg-gray-800 transition-colors" />
              </div>
            </div>
          </div>

          {/* Carte */}
          <div className="relative" style={{ height: 'calc(100vh - 73px)' }}>
            <div ref={containerRef} className="w-full h-full" />
            
            {/* Légende */}
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl p-3 shadow-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Légende</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#E4002B' }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">3 étoiles Michelin</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#f97316' }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">2 étoiles Michelin</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#facc15' }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">1 étoile Michelin</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#4ade80' }} />
                  <span className="text-xs text-gray-600 dark:text-gray-400">Green Star</span>
                </div>
              </div>
            </div>

            {/* Contrôles zoom */}
            <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
              <button
                onClick={() => mapRef.current?.zoomIn()}
                className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-gray-700 dark:text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </button>
              <button
                onClick={() => mapRef.current?.zoomOut()}
                className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5 text-gray-700 dark:text-gray-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
                </svg>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom nav mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30">
        <BottomNav />
      </div>
    </div>
  )
}