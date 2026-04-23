'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams } from 'next/navigation'
import UserProfileView from '@/components/profile/UserProfileView'
import BottomNav from '@/components/layout/BottomNav'

export default function ChefPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const [userId, setUserId] = useState<string | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [variant, setVariant] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    setVariant(mq.matches ? 'light' : 'dark')
    const handler = (e: MediaQueryListEvent) => setVariant(e.matches ? 'light' : 'dark')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/chefs/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setUserId(data.user_id))
      .catch(() => setNotFound(true))
  }, [id])

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-neutral-950 gap-4">
        <span className="text-4xl">🍽️</span>
        <p className="text-white/50 text-sm">Profil introuvable</p>
        <BottomNav />
      </div>
    )
  }

  if (!userId) {
    return (
      <div className="flex items-center justify-center h-dvh bg-neutral-950">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const isSelf = session?.user?.id === userId

  return <UserProfileView userId={userId} isSelf={isSelf} showBackButton variant={variant} />
}
