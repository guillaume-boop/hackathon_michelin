'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-toastify'

const inputClass = 'w-full px-4 py-3.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 border border-gray-200 dark:border-gray-700 focus:border-[#E4002B] focus:outline-none text-sm transition-all'

export default function SignupPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    })

    if (!res.ok) {
      const body = await res.json()
      const errorMessage = body.message ?? 'Erreur lors de la création du compte.'
      setError(errorMessage)
      toast.error(errorMessage)
      setLoading(false)
      return
    }

    toast.success('Compte créé avec succès ! Connexion en cours...')

    const signInRes = await signIn('credentials', { email, password, redirect: false })
    if (!signInRes?.ok) {
      setError('Compte créé. Tu peux maintenant te connecter.')
      toast.info('Compte créé ! Connecte-toi maintenant')
      setLoading(false)
      return
    }

    toast.success('Bienvenue sur FoodTok !')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-dvh flex bg-red-600 dark:bg-red-800">
      {/* Colonne gauche - Image avec texte en bas */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col bg-red-600 dark:bg-red-800">
        {/* Image qui s'affiche en entier */}
        <div className="relative w-full h-full flex flex-col">
          <img 
            src="/images/image2.png" 
            alt="FoodTok gastronomie" 
            className="w-full h-auto object-contain"
          />
          
          {/* Texte en bas de l'image */}
          <div className="p-8 mt-auto bg-red-600 dark:bg-black">
            <div className="max-w-md">
              <h2 className="text-4xl font-bold text-white mb-3">
                La référence gastronomique
              </h2>
              <p className="text-white/80 dark:text-white/70 text-sm leading-relaxed">
                Découvrez les meilleurs restaurants étoilés, partagez vos expériences culinaires et rejoignez une communauté passionnée de foodies.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Colonne droite - Formulaire */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 bg-white dark:bg-black transition-colors overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo mobile (visible uniquement sur mobile) */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#E4002B]">
                <span className="text-white font-black text-lg">F</span>
              </div>
              <span className="font-black text-xl tracking-tight text-gray-900 dark:text-white">FoodTok</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="flex justify-center mb-5">
              <div className="bg-gray-100 dark:bg-gray-800 h-18 w-18 rounded-xl p-3 shadow-lg">
                <img 
                  src="/icons/etoile-michelin.svg" 
                  alt="Michelin" 
                  className="w-14 h-14 dark:brightness-90"
                />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Créer un compte</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Rejoins l'aventure</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Nom d'utilisateur
              </label>
              <input 
                type="text" 
                placeholder="Chef étoilé" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                minLength={3} 
                className={inputClass} 
                autoComplete="username" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email
              </label>
              <input 
                type="email" 
                placeholder="exemple@email.com" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                className={inputClass} 
                autoComplete="email" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Mot de passe
              </label>
              <input 
                type="password" 
                placeholder="•••••••• (min. 6 caractères)" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                minLength={6} 
                className={inputClass} 
                autoComplete="new-password" 
              />
            </div>

            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm text-center py-1">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-semibold text-sm mt-2 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#E4002B' }}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Création...</span>
                </div>
              ) : (
                'Créer mon compte'
              )}
            </button>
          </form>

          <p className="text-gray-600 dark:text-gray-400 text-sm text-center mt-6">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-[#E4002B] hover:underline font-semibold">
              Se connecter
            </Link>
          </p>

          <Link 
            href="/" 
            className="block text-center text-gray-500 dark:text-gray-500 text-xs mt-4 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Continuer sans compte →
          </Link>
        </div>
      </div>
    </div>
  )
}