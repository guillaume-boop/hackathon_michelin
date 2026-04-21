'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (!res?.ok) {
      setError('Email ou mot de passe incorrect.')
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
          <h1 className="text-xl font-semibold text-white">Connexion</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-white placeholder-neutral-500 border border-neutral-700 focus:border-neutral-500 focus:outline-none text-sm"
          />

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-white text-neutral-900 font-semibold hover:bg-neutral-200 transition-colors disabled:opacity-50 text-sm mt-1"
          >
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="text-neutral-500 text-sm text-center mt-6">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-white hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
