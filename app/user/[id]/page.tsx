'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import UserProfileView from '@/components/profile/UserProfileView'

export default function UserPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()
  const [variant, setVariant] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    setVariant(mq.matches ? 'light' : 'dark')
    const handler = (e: MediaQueryListEvent) => setVariant(e.matches ? 'light' : 'dark')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const isSelf = (session?.user as { id?: string })?.id === id

  return <UserProfileView userId={id} isSelf={isSelf} showBackButton variant={variant} />
}
