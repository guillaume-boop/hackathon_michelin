'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

    // 1. Créer le compte via notre API
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username }),
    })

    if (!res.ok) {
      const body = await res.json()
      setError(body.message ?? 'Erreur lors de la création du compte.')
      setLoading(false)
      return
    }

    // 2. Connecter automatiquement
    const signInRes = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (!signInRes?.ok) {
      setError('Compte créé mais connexion impossible. Essaie de te connecter.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-600 mb-4">
            <span className="text-xl font-bold">M</span>
          </div>
          <h1 className="text-xl font-semibold text-white">Créer un compte</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nom d'utilisateur"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            minLength={3}
            className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:border-neutral-500 focus:outline-none text-sm"
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:border-neutral-500 focus:outline-none text-sm"
          />
          <input
            type="password"
            placeholder="Mot de passe (min. 6 caractères)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:border-neutral-500 focus:outline-none text-sm"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-neutral-900 font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 text-sm mt-1"
          >
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-neutral-500 text-sm text-center mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-white hover:underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
