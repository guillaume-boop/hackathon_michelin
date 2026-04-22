'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const inputClass = 'w-full px-4 py-3.5 rounded-2xl text-white placeholder-white/30 border border-white/10 focus:border-white/30 focus:outline-none text-sm transition-colors bg-white/5'

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
      setLoading(false)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-black px-6" style={{ background: 'radial-gradient(ellipse at top, rgba(228,0,43,0.12) 0%, #000 60%)' }}>
      <div className="w-full max-w-sm">

        <div className="text-center mb-10">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5 shadow-lg shadow-red-900/40"
            style={{ background: '#E4002B' }}
          >
            <span className="text-white font-bold text-2xl tracking-tight">M</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Bienvenue</h1>
          <p className="text-white/40 text-sm">Connecte-toi pour continuer</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} autoComplete="email" />
          <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} autoComplete="current-password" />

          {error && (
            <p className="text-red-400 text-sm text-center py-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm mt-1 disabled:opacity-50 transition-opacity active:opacity-80"
            style={{ background: '#E4002B' }}
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-white/30 text-sm text-center mt-6">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-white hover:underline">
            Créer un compte
          </Link>
        </p>

        <Link href="/" className="block text-center text-white/20 text-xs mt-4 hover:text-white/40 transition-colors">
          Continuer sans compte →
        </Link>
      </div>
    </div>
  )
}
