'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'

type Restaurant = {
  id: string
  name: string
  city: string
  michelin_stars: number
  green_stars: boolean
  lat: number
  lng: number
}

function markerColor(stars: number, green: boolean) {
  if (green && stars === 0) return '#4ade80'
  if (stars >= 3) return '#E4002B'
  if (stars === 2) return '#f97316'
  return '#facc15'
}

export default function MapClient() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

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

    // Cluster group — clic sur cluster = zoom
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

          cluster.addLayer(marker)
        })

        if (mapRef.current) currentMap.addLayer(cluster)
      })

    return () => {
      mapRef.current = null
      try { map.remove() } catch { /* already removed */ }
    }
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
