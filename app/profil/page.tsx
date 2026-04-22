'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'

type UserProfile = {
  id: string
  username: string
  email: string
  avatar_url: string | null
  role: string
  circle_score: number
  created_at: string
}

type Experience = {
  id: string
  rating: number
  note: string | null
  visited_at: string
  restaurant_id: string
}

export default function ProfilPage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthGate, setShowAuthGate] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return }
    Promise.all([
      fetch(`/api/users/${session.user.id}`).then(r => r.json()),
      fetch(`/api/experiences?user_id=${session.user.id}`).then(r => r.json()),
    ]).then(([user, exps]) => {
      setProfile(user)
      setExperiences(Array.isArray(exps) ? exps : [])
    }).finally(() => setLoading(false))
  }, [session])

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-black gap-6 px-6 text-center" style={{ paddingBottom: '80px' }}>
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl border border-white/10">
          👤
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Mon profil</h2>
          <p className="text-white/40 text-sm">Connecte-toi pour accéder à ton profil.</p>
        </div>
        <button
          onClick={() => setShowAuthGate(true)}
          className="px-8 py-3.5 rounded-2xl text-white font-semibold"
          style={{ background: '#E4002B' }}
        >
          Se connecter
        </button>
        {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-black min-h-dvh" style={{ paddingBottom: '80px' }}>

      {/* Header */}
      <div className="relative pt-safe">
        <div className="absolute inset-0 h-48" style={{ background: 'linear-gradient(180deg, rgba(228,0,43,0.12) 0%, transparent 100%)' }} />

        <div className="relative px-4 pt-4">
          <div className="flex items-start justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Mon profil</h1>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-medium active:bg-white/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              Déconnexion
            </button>
          </div>

          {/* Avatar + info */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20 flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold" style={{ background: '#E4002B' }}>
                  {(profile?.username?.[0] ?? session.user?.name?.[0] ?? '?').toUpperCase()}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-white font-bold text-xl">@{profile?.username ?? session.user?.name}</h2>
              <p className="text-white/40 text-sm mt-0.5">{session.user?.email}</p>
              {profile?.role === 'chef' && (
                <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: 'rgba(228,0,43,0.2)', color: '#E4002B' }}>
                  👨‍🍳 Chef
                </span>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: 'Circle Score', value: profile?.circle_score ?? 0, accent: true },
              { label: 'Expériences', value: experiences.length, accent: false },
              { label: 'Membre depuis', value: profile?.created_at ? new Date(profile.created_at).getFullYear() : '—', accent: false },
            ].map(({ label, value, accent }) => (
              <div key={label} className="p-3 rounded-2xl border border-white/10 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <p className={`text-lg font-bold ${accent ? '' : 'text-white'}`} style={accent ? { color: '#E4002B' } : {}}>
                  {value}
                </p>
                <p className="text-white/30 text-[10px] uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent experiences */}
      <div className="px-4">
        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-3">Mes dernières expériences</p>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white/5 animate-pulse mb-2" />
          ))
        ) : experiences.length === 0 ? (
          <div className="text-center py-10">
            <span className="text-3xl">🍽️</span>
            <p className="text-white/30 text-sm mt-2">Aucune expérience enregistrée.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {experiences.slice(0, 10).map(exp => (
              <div key={exp.id} className="flex items-center gap-3 p-3.5 rounded-2xl border border-white/5" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(228,0,43,0.12)' }}>
                  🍽️
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: exp.rating }).map((_, i) => (
                      <span key={i} style={{ color: '#C9AA71' }} className="text-sm">★</span>
                    ))}
                  </div>
                  {exp.note && <p className="text-white/50 text-xs truncate">&ldquo;{exp.note}&rdquo;</p>}
                  <p className="text-white/30 text-[10px] mt-0.5">
                    {new Date(exp.visited_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
