'use client'

import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import UserProfileView from '@/components/profile/UserProfileView'

export default function UserPage() {
  const { id } = useParams<{ id: string }>()
  const { data: session } = useSession()

  const isSelf = session?.user?.id === id

  return <UserProfileView userId={id} isSelf={isSelf} showBackButton />
}
