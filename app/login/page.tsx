'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'react-toastify'

const inputClass = 'w-full px-4 py-3.5 bg-gray-200  rounded-xl text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-500 border border-gray-200 dark:border-gray-800 focus:border-[#E4002B] focus:outline-none text-sm transition-all  dark:bg-gray-900/90 backdrop-blur-sm'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    const res = await signIn('credentials', { email, password, redirect: false })
    
    if (!res?.ok) {
      setError('Email ou mot de passe incorrect.')
      toast.error('Email ou mot de passe incorrect')
      setLoading(false)
      return
    }
    
    toast.success('Connexion réussie ! Redirection...')
    router.push('/')
    router.refresh()
  }

  return (
    <div 
      className="min-h-dvh flex flex-col items-center justify-center px-6 transition-colors relative"
      style={{
        backgroundImage: 'url(/images/image.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay pour améliorer la lisibilité */}
      
      {/* Dégradé subtil */}
      
      <div className="w-full max-w-sm relative z-10 bg-white dark:bg-gray-900 rounded  shadow-4xl px-7 py-5 border border-white/20 ">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-5">
            <div className="bg-gray-200 dark:bg-gray-800 h-18 w-18 rounded-xl p-3 shadow-sm">
              <img 
                src="/icons/etoile-michelin.svg" 
                alt="Michelin" 
                className="w-14 h-14"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Bienvenue</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Connecte-toi pour continuer</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              className={inputClass} 
              autoComplete="current-password" 
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
                <span>Connexion...</span>
              </div>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <p className="text-gray-600 dark:text-gray-400 text-sm text-center mt-6">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-[#E4002B] hover:underline font-semibold">
            Créer un compte
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
  )
}