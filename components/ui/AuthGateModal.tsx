'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState, useCallback } from 'react'

interface AuthGateModalProps {
  onClose: () => void
  message?: string
}

export default function AuthGateModal({
  onClose,
  message = 'Connecte-toi pour continuer',
}: AuthGateModalProps) {
  const [isVisible, setIsVisible] = useState(false)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 300) // Attendre la fin de l'animation
  }, [onClose])

  useEffect(() => {
    // Animation d'entrée
    setIsVisible(true)
    
    const onKey = (e: KeyboardEvent) => { 
      if (e.key === 'Escape') handleClose() 
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handleClose])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center transition-all duration-300"
      style={{
        backgroundColor: `rgba(0, 0, 0, ${isVisible ? 0.6 : 0})`,
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
      }}
      onClick={handleClose}
    >
      <div
        className={`w-full max-w-md mx-4 transition-all duration-300 transform ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-8'
        }`}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative rounded-2xl p-6 bg-white dark:bg-[#111] shadow-2xl border border-gray-200 dark:border-white/10">
          
          {/* Bouton fermeture en haut à droite */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/60 transition-colors bg-white/10 hover:bg-gray-100 dark:hover:bg-white/10"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Logo - avec Image de next/image */}
          <div className="flex justify-center mb-5">
            <div className="bg-gray-100 dark:bg-gray-800 h-18 w-18 rounded-xl p-3">
              <Image 
                src="/icons/etoile-michelin.svg" 
                alt="Michelin" 
                width={56}
                height={56}
                className="w-14 h-14"
              />
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
            {message}
          </h2>
          <p className="text-gray-500 dark:text-white/50 text-sm text-center mb-7 leading-relaxed">
            Rejoins la communauté Michelin pour liker, partager et sauvegarder tes expériences.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/login"
              className="w-full py-3.5 rounded-xl text-white font-semibold text-center text-sm transition-all hover:bg-[#c40026] bg-[#E4002B]"
            >
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="w-full py-3.5 rounded-xl text-gray-700 dark:text-white font-semibold text-center text-sm border border-gray-200 dark:border-white/10 transition-all hover:bg-gray-50 dark:hover:bg-white/5 bg-amber-50 dark:bg-white/5"
            >
              Créer un compte
            </Link>
          </div>
          
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-white/30">
            En continuant, tu acceptes nos{' '}
            <Link href="/terms" className="text-[#E4002B] hover:underline">
              Conditions
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}