'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'
import Stars from '@/components/ui/Stars'

type Chef = {
  id: string
  bio: string | null
  video_url: string | null
  users: { id: string; username: string; avatar_url: string | null }
  restaurants: { id: string; name: string; city: string; michelin_stars: number; green_stars: boolean }
}

type FriendLocation = {
  user_id: string
  lat: number
  lng: number
  updated_at: string
  users?: { username: string; avatar_url: string | null }
  restaurant?: { name: string; city: string }
}

const CITY_PINS = [
  { city: 'Paris', country: 'FR', x: 48, y: 32 },
  { city: 'Tokyo', country: 'JP', x: 80, y: 38 },
  { city: 'New York', country: 'US', x: 22, y: 37 },
  { city: 'London', country: 'GB', x: 46, y: 29 },
  { city: 'Copenhague', country: 'DK', x: 50, y: 26 },
  { city: 'Barcelona', country: 'ES', x: 47, y: 36 },
  { city: 'Menton', country: 'FR', x: 49, y: 36 },
]

export default function AmisPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<'discover' | 'map'>('discover')
  const [chefs, setChefs] = useState<Chef[]>([])
  const [friendLocations, setFriendLocations] = useState<FriendLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState<Set<string>>(new Set())
  const [showAuthGate, setShowAuthGate] = useState(false)

  useEffect(() => {
    fetch('/api/chefs')
      .then(r => r.json())
      .then(d => setChefs(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false))

    if (session) {
      fetch('/api/map/friends')
        .then(r => r.json())
        .then(d => setFriendLocations(Array.isArray(d) ? d : []))
    }
  }, [session])

  const handleFollow = async (userId: string) => {
    if (!session) { setShowAuthGate(true); return }
    const isFollowing = following.has(userId)
    setFollowing(prev => {
      const next = new Set(prev)
      if (isFollowing) next.delete(userId)
      else next.add(userId)
      return next
    })
    await fetch(`/api/users/${userId}/follow`, {
      method: isFollowing ? 'DELETE' : 'POST',
    })
  }

  return (
    <div className="flex flex-col bg-black min-h-dvh" style={{ paddingBottom: '80px' }}>

      {/* Header */}
      <div className="pt-safe px-4 pt-4 pb-0">
        <h1 className="text-2xl font-bold text-white mb-4">Communauté</h1>

        {/* Tab switcher */}
        <div className="flex gap-0 bg-white/5 rounded-2xl p-1 mb-5">
          {(['discover', 'map'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${tab === t ? 'bg-white text-black' : 'text-white/50'}`}
            >
              {t === 'discover' ? '✦ Découvrir' : '🗺 Map amis'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'discover' ? (
        <div className="px-4 flex flex-col gap-4">
          {/* Suggested section */}
          <p className="text-white/40 text-xs uppercase tracking-widest font-semibold">Chefs & Food lovers</p>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />
            ))
          ) : chefs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/40 text-sm">Lance le script de seed pour voir des profils.</p>
            </div>
          ) : (
            chefs.map(chef => (
              <div
                key={chef.id}
                className="flex items-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/5"
              >
                {/* Avatar */}
                <Link href={`/chef/${chef.id}`} className="shrink-0">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-neutral-800">
                    {chef.users?.avatar_url ? (
                      <img src={chef.users.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold" style={{ background: '#E4002B' }}>
                        {(chef.users?.username?.[0] ?? '?').toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/chef/${chef.id}`}>
                    <p className="text-white font-semibold text-sm truncate">@{chef.users?.username}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-white/50 text-xs truncate">{chef.restaurants?.name}</p>
                      <Stars count={chef.restaurants?.michelin_stars ?? 0} green={chef.restaurants?.green_stars} />
                    </div>
                    {chef.bio && (
                      <p className="text-white/40 text-xs mt-1 line-clamp-1">{chef.bio}</p>
                    )}
                  </Link>
                </div>

                {/* Follow button */}
                <button
                  onClick={() => handleFollow(chef.users?.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-xs font-semibold transition-all active:scale-95 ${
                    following.has(chef.users?.id)
                      ? 'bg-white/10 text-white/60 border border-white/20'
                      : 'text-white'
                  }`}
                  style={following.has(chef.users?.id) ? {} : { background: '#E4002B' }}
                >
                  {following.has(chef.users?.id) ? 'Suivi' : 'Suivre'}
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="px-4 flex flex-col gap-4">
          {!session ? (
            <div
              className="rounded-3xl overflow-hidden border border-white/10 flex flex-col items-center justify-center gap-4 p-8 text-center"
              style={{ height: '280px', background: 'linear-gradient(135deg, #1a0a0a, #0a0a1a)' }}
            >
              <span className="text-4xl">🗺️</span>
              <div>
                <p className="text-white font-semibold mb-1">Où mangent tes amis ?</p>
                <p className="text-white/40 text-sm">Connecte-toi pour voir la map en temps réel.</p>
              </div>
              <button
                onClick={() => setShowAuthGate(true)}
                className="px-6 py-2.5 rounded-full text-white text-sm font-semibold"
                style={{ background: '#E4002B' }}
              >
                Se connecter
              </button>
            </div>
          ) : (
            <>
              {/* Stylized world map */}
              <div
                className="relative rounded-3xl overflow-hidden border border-white/10"
                style={{ height: '280px', background: 'linear-gradient(135deg, #050d1f, #0a1a0a)' }}
              >
                {/* Grid lines */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {[20, 40, 60, 80].map(x => (
                    <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="white" strokeWidth="0.3" />
                  ))}
                  {[25, 50, 75].map(y => (
                    <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeWidth="0.3" />
                  ))}
                </svg>

                {/* City pins */}
                {CITY_PINS.map(pin => (
                  <div
                    key={pin.city}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${pin.x}%`, top: `${pin.y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="w-2 h-2 rounded-full bg-white/60 shadow-lg shadow-white/20" />
                    <span className="text-white/40 text-[8px] mt-0.5 whitespace-nowrap">{pin.city}</span>
                  </div>
                ))}

                {/* Friend location pins */}
                {friendLocations.slice(0, 5).map((loc, i) => {
                  const xPct = ((loc.lng + 180) / 360) * 100
                  const yPct = ((90 - loc.lat) / 180) * 100
                  return (
                    <div
                      key={loc.user_id}
                      className="absolute flex items-center justify-center"
                      style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -50%)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-lg"
                        style={{ background: '#E4002B' }}
                      >
                        <span className="text-white text-xs font-bold flex items-center justify-center w-full h-full">
                          {String.fromCharCode(65 + i)}
                        </span>
                      </div>
                    </div>
                  )
                })}

                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-white/30 text-[10px] uppercase tracking-widest">Live map</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white/40 text-[10px]">{friendLocations.length} amis en ligne</span>
                  </div>
                </div>
              </div>

              {/* Friend list */}
              {friendLocations.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-4">Aucun ami en ligne pour le moment.</p>
              ) : (
                friendLocations.map(loc => (
                  <div key={loc.user_id} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: '#E4002B' }}>
                      {(loc.users?.username?.[0] ?? '?').toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">@{loc.users?.username}</p>
                      <p className="text-white/40 text-xs">{loc.restaurant?.name ?? `${loc.lat.toFixed(1)}, ${loc.lng.toFixed(1)}`}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-white/30 text-[10px]">En ligne</span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      )}

      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
      <BottomNav />
    </div>
  )
}
