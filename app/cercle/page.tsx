'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'
import Stars from '@/components/ui/Stars'

type Experience = {
  id: string
  restaurant_id: string
  rating: number
  note: string | null
  visited_at: string
  restaurant?: { name: string; city: string; country: string; michelin_stars: number; green_stars: boolean }
}

type Circle = {
  role: string
  circles: { id: string; name: string; owner_id: string; created_at: string }
}

type UserProfile = {
  circle_score: number
  username: string
  avatar_url: string | null
}

const SCORE_LEVELS = [
  { min: 0, max: 49, label: 'Curieux', color: '#6b7280' },
  { min: 50, max: 149, label: 'Épicurien', color: '#C9AA71' },
  { min: 150, max: 349, label: 'Connaisseur', color: '#E4002B' },
  { min: 350, max: 699, label: 'Expert', color: '#a855f7' },
  { min: 700, max: Infinity, label: 'Légende', color: '#f59e0b' },
]

function getLevel(score: number) {
  return SCORE_LEVELS.find(l => score >= l.min && score <= l.max) ?? SCORE_LEVELS[0]
}

const COUNTRIES_BY_CONTINENT = [
  { name: 'Europe', x: 47, y: 35, count: 0 },
  { name: 'Asie', x: 73, y: 40, count: 0 },
  { name: 'Amérique', x: 22, y: 45, count: 0 },
  { name: 'Océanie', x: 82, y: 65, count: 0 },
  { name: 'Afrique', x: 52, y: 55, count: 0 },
]

export default function CerclePage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<'vault' | 'map' | 'circles'>('vault')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [circles, setCircles] = useState<Circle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [showNewCircle, setShowNewCircle] = useState(false)
  const [newCircleName, setNewCircleName] = useState('')

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return }

    Promise.all([
      fetch(`/api/users/${session.user.id}`).then(r => r.json()),
      fetch(`/api/experiences?user_id=${session.user.id}`).then(r => r.json()),
      fetch('/api/circles').then(r => r.json()),
    ]).then(([user, exps, circs]) => {
      setProfile(user)
      setExperiences(Array.isArray(exps) ? exps : [])
      setCircles(Array.isArray(circs) ? circs : [])
    }).finally(() => setLoading(false))
  }, [session])

  const handleCreateCircle = async () => {
    if (!newCircleName.trim() || !session) return
    const res = await fetch('/api/circles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newCircleName }),
    })
    if (res.ok) {
      const circle = await res.json()
      setCircles(prev => [...prev, { role: 'owner', circles: circle }])
      setNewCircleName('')
      setShowNewCircle(false)
    }
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-black gap-6 px-6 text-center" style={{ paddingBottom: '80px' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl" style={{ background: 'rgba(228,0,43,0.15)', border: '1px solid rgba(228,0,43,0.3)' }}>
          ✦
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Michelin Circle</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            Construis ton identité gastronomique, sauvegarde tes souvenirs et débloque des expériences exclusives.
          </p>
        </div>
        <button
          onClick={() => setShowAuthGate(true)}
          className="px-8 py-3.5 rounded-2xl text-white font-semibold"
          style={{ background: '#E4002B' }}
        >
          Rejoindre le cercle
        </button>
        {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} message="Accède au Michelin Circle" />}
        <BottomNav />
      </div>
    )
  }

  const score = profile?.circle_score ?? 0
  const level = getLevel(score)
  const nextLevel = SCORE_LEVELS[SCORE_LEVELS.indexOf(level) + 1]
  const progress = nextLevel
    ? ((score - level.min) / (nextLevel.min - level.min)) * 100
    : 100

  const visitedCountries = Array.from(new Set(experiences.map(e => e.restaurant?.country).filter((c): c is string => !!c)))
  const totalStars = experiences.reduce((sum, e) => sum + (e.restaurant?.michelin_stars ?? 0), 0)

  return (
    <div className="flex flex-col bg-black min-h-dvh" style={{ paddingBottom: '80px' }}>

      {/* Score header */}
      <div
        className="relative px-4 pt-safe pb-6"
        style={{ background: 'linear-gradient(180deg, rgba(228,0,43,0.15) 0%, transparent 100%)' }}
      >
        <div className="pt-4 flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Mon Cercle</h1>
          <div
            className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: level.color, color: '#000' }}
          >
            {level.label}
          </div>
        </div>

        {/* Score ring */}
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34"
                fill="none"
                stroke={level.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - progress / 100)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-white font-bold text-xl leading-none">{score}</span>
              <span className="text-white/40 text-[9px] uppercase tracking-wider">pts</span>
            </div>
          </div>

          <div className="flex-1">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center">
                <p className="text-white font-bold text-xl">{experiences.length}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-wide">Visites</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xl">{visitedCountries.length}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-wide">Pays</p>
              </div>
              <div className="text-center">
                <p className="text-white font-bold text-xl">{totalStars}</p>
                <p className="text-white/40 text-[10px] uppercase tracking-wide">Étoiles</p>
              </div>
            </div>
            {nextLevel && (
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-white/30 mb-1">
                  <span>{score} pts</span>
                  <span>{nextLevel.min} pts → {nextLevel.label}</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${progress}%`, background: level.color }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 mb-4">
        <div className="flex gap-0 bg-white/5 rounded-2xl p-1">
          {([['vault', '🔒 Vault'], ['map', '🌍 Carte'], ['circles', '◎ Circles']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${tab === t ? 'bg-white text-black' : 'text-white/50'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Vault tab */}
      {tab === 'vault' && (
        <div className="px-4 flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)
          ) : experiences.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center gap-3">
              <span className="text-4xl">📸</span>
              <p className="text-white/50 text-sm">Ton vault est vide pour l&apos;instant.</p>
              <p className="text-white/30 text-xs">Ajoute des expériences pour les retrouver ici.</p>
            </div>
          ) : (
            experiences.map(exp => (
              <div key={exp.id} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: 'rgba(228,0,43,0.15)' }}>
                  🍽️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-semibold text-sm truncate">{exp.restaurant?.name ?? 'Restaurant'}</p>
                    <Stars count={exp.restaurant?.michelin_stars ?? 0} green={exp.restaurant?.green_stars} />
                  </div>
                  <p className="text-white/40 text-xs mt-0.5">{exp.restaurant?.city} · {new Date(exp.visited_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                  {exp.note && <p className="text-white/60 text-xs mt-1 line-clamp-1">&ldquo;{exp.note}&rdquo;</p>}
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: exp.rating }).map((_, i) => (
                    <span key={i} style={{ color: '#C9AA71' }} className="text-sm">★</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Map tab */}
      {tab === 'map' && (
        <div className="px-4 flex flex-col gap-4">
          <div
            className="relative rounded-3xl overflow-hidden border border-white/10"
            style={{ height: '260px', background: 'linear-gradient(135deg, #050d1f, #0d1a0a)' }}
          >
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
              {[20, 40, 60, 80].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="100" stroke="white" strokeWidth="0.3" />)}
              {[25, 50, 75].map(y => <line key={`h${y}`} x1="0" y1={y} x2="100" y2={y} stroke="white" strokeWidth="0.3" />)}
            </svg>

            {/* Visited country markers */}
            {visitedCountries.length > 0 && COUNTRIES_BY_CONTINENT.map(c => (
              <div
                key={c.name}
                className="absolute"
                style={{ left: `${c.x}%`, top: `${c.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <div className="w-3 h-3 rounded-full border border-white/40" style={{ background: '#E4002B' }} />
              </div>
            ))}

            {/* Empty state */}
            {experiences.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <span className="text-3xl">🌍</span>
                <p className="text-white/30 text-xs">Aucune expérience enregistrée</p>
              </div>
            )}

            <div className="absolute bottom-3 left-3">
              <span className="text-white/30 text-[10px] uppercase tracking-widest">
                {visitedCountries.length} pays visités
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {visitedCountries.map(country => {
              const count = experiences.filter(e => e.restaurant?.country === country).length
              return (
                <div key={country} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-white text-sm font-medium">{country}</span>
                  <span className="text-white/40 text-xs">{count} visite{count > 1 ? 's' : ''}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Circles tab */}
      {tab === 'circles' && (
        <div className="px-4 flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)
          ) : (
            <>
              {circles.map(({ role, circles: c }) => (
                <div key={c.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(201,170,113,0.15)' }}>
                    ◎
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-semibold text-sm">{c.name}</p>
                    <p className="text-white/40 text-xs capitalize">{role} · Créé {new Date(c.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              ))}

              {/* Create circle */}
              {showNewCircle ? (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                  <input
                    autoFocus
                    value={newCircleName}
                    onChange={e => setNewCircleName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateCircle() }}
                    placeholder="Nom du cercle…"
                    className="w-full bg-transparent text-white text-sm placeholder-white/30 outline-none mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateCircle}
                      className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                      style={{ background: '#E4002B' }}
                    >
                      Créer
                    </button>
                    <button
                      onClick={() => setShowNewCircle(false)}
                      className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm font-semibold"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewCircle(true)}
                  className="flex items-center justify-center gap-2 p-4 rounded-2xl border border-dashed border-white/20 text-white/50 text-sm active:bg-white/5 transition-colors"
                >
                  <span className="text-lg">+</span>
                  <span>Créer un nouveau cercle</span>
                </button>
              )}
            </>
          )}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
