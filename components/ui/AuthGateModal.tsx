'use client'

import Link from 'next/link'
import { useEffect } from 'react'

interface AuthGateModalProps {
  onClose: () => void
  message?: string
}

export default function AuthGateModal({
  onClose,
  message = 'Connecte-toi pour continuer',
}: AuthGateModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl border-t border-white/10 p-6 pb-10"
        style={{ background: '#111' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <div className="flex justify-center mb-5">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: '#E4002B' }}
          >
            <span className="text-white font-bold text-xl tracking-tight">M</span>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white text-center mb-2">{message}</h2>
        <p className="text-white/50 text-sm text-center mb-7 leading-relaxed">
          Rejoins la communauté Michelin pour liker, partager et sauvegarder tes expériences.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/login"
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-center text-sm active:opacity-80 transition-opacity"
            style={{ background: '#E4002B' }}
          >
            Se connecter
          </Link>
          <Link
            href="/signup"
            className="w-full py-3.5 rounded-2xl bg-white/10 text-white font-semibold text-center text-sm border border-white/10 active:opacity-80 transition-opacity"
          >
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}
