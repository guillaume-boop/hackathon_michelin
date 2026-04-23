'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import UserProfileView from '@/components/profile/UserProfileView'
import AuthGateModal from '@/components/ui/AuthGateModal'
import BottomNav from '@/components/layout/BottomNav'

export default function ProfilPage() {
  const { data: session, status } = useSession()
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [variant, setVariant] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    setVariant(mq.matches ? 'light' : 'dark')
    const handler = (e: MediaQueryListEvent) => setVariant(e.matches ? 'light' : 'dark')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-black gap-6 px-6 text-center pb-24">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl border border-white/10">👤</div>
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

  return <UserProfileView userId={session.user.id} isSelf variant={variant} />
}
