'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import Image from 'next/image'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'

type Ami = {
  followee_id: string
  users: { id: string; username: string; avatar_url: string | null } | null
}

type Follower = {
  follower_id: string
  users: { id: string; username: string; avatar_url: string | null } | null
}

export default function AmisPage() {
  return (
    <Suspense>
      <AmisContent />
    </Suspense>
  )
}

function AmisContent() {
  const { data: session } = useSession()

  const [tab, setTab] = useState<'suivis' | 'me_suivent'>('suivis')
  const [showAuthGate, setShowAuthGate] = useState(false)

  const [amis, setAmis] = useState<Ami[]>([])
  const [loadingAmis, setLoadingAmis] = useState(false)

  const [followers, setFollowers] = useState<Follower[]>([])
  const [loadingFollowers, setLoadingFollowers] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) return
    setLoadingAmis(true)
    fetch(`/api/users/${session.user.id}/following`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : []
        setAmis(list.map((item: { followee_id: string; users: Ami['users'] | Ami['users'][] }) => ({
          followee_id: item.followee_id,
          users: Array.isArray(item.users) ? (item.users[0] ?? null) : item.users,
        })))
      })
      .finally(() => setLoadingAmis(false))
  }, [session?.user?.id])

  useEffect(() => {
    if (!session?.user?.id) return
    setLoadingFollowers(true)
    fetch(`/api/users/${session.user.id}/followers`)
      .then(r => r.json())
      .then(d => {
        const list = Array.isArray(d) ? d : []
        setFollowers(list.map((item: { follower_id: string; users: Follower['users'] | Follower['users'][] }) => ({
          follower_id: item.follower_id,
          users: Array.isArray(item.users) ? (item.users[0] ?? null) : item.users,
        })))
      })
      .finally(() => setLoadingFollowers(false))
  }, [session?.user?.id])

  const renderUserList = (
    list: { id: string; username: string; avatar_url: string | null; href: string }[],
    loading: boolean,
    emptyLabel: string
  ) => {
    if (!session) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center mt-8">
          <span className="text-4xl">👥</span>
          <div>
            <p className="text-gray-900 dark:text-white font-semibold mb-1">{emptyLabel}</p>
            <p className="text-gray-500 dark:text-white/40 text-sm">Connecte-toi pour voir ta communauté.</p>
          </div>
          <button
            onClick={() => setShowAuthGate(true)}
            className="px-6 py-2.5 rounded-full text-white text-sm font-semibold bg-[#E4002B]"
          >
            Se connecter
          </button>
        </div>
      )
    }
    if (loading) {
      return Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 rounded-2xl bg-gray-100 dark:bg-white/5 animate-pulse" />
      ))
    }
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-gray-900 dark:text-white font-semibold">{emptyLabel}</p>
        </div>
      )
    }
    return list.map(u => {
      const avatarUrl = u.avatar_url ?? `https://picsum.photos/seed/${u.username}/100/100`
      return (
        <Link
          key={u.id}
          href={u.href}
          className="flex items-center gap-3 p-3 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
        >
          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-300 dark:bg-neutral-700">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-gray-900 dark:text-white font-bold text-sm">@{u.username}</p>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4 opacity-20 flex-shrink-0 text-gray-900 dark:text-white">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )
    })
  }

  const suivisList = amis
    .filter(a => a.users)
    .map(a => ({ id: a.followee_id, username: a.users!.username, avatar_url: a.users!.avatar_url, href: `/chef/${a.followee_id}` }))

  const followersList = followers
    .filter(f => f.users)
    .map(f => ({ id: f.follower_id, username: f.users!.username, avatar_url: f.users!.avatar_url, href: `/chef/${f.follower_id}` }))

  return (
    <div className="flex h-screen bg-white dark:bg-black">

      {/* ─── SIDEBAR GAUCHE (lg+) ─── */}
      <aside className="hidden lg:flex flex-col w-52 xl:w-60 2xl:w-72 shrink-0 border-r border-gray-200 dark:border-gray-800 h-full overflow-y-auto bg-white dark:bg-black p-4 xl:p-6">
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 xl:w-11 xl:h-11 rounded-lg flex items-center justify-center bg-[#E4002B]">
              <span className="text-white font-black text-lg">M</span>
            </div>
            <span className="font-black text-base xl:text-lg tracking-tight text-gray-900 dark:text-white hidden xl:block">MICHELIN</span>
          </Link>
        </div>

        <nav className="space-y-1 flex-1">
          {[
            { href: '/', label: 'Pour toi', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.954c.44-.44 1.152-.44 1.592 0L21.75 12M4.5 10.5v6.75a2.25 2.25 0 0 0 2.25 2.25h10.5a2.25 2.25 0 0 0 2.25-2.25V10.5m-9 7.5v-4.5h3v4.5" /></svg> },
            { href: '/amis', label: 'Communauté', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg> },
            { href: '/decouvrir', label: 'Explorer', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg> },
            { href: '/map', label: 'Carte', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg> },
            { href: '/profil', label: 'Profil', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg> },
          ].map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
              <span className="text-gray-500 dark:text-gray-500">{item.icon}</span>
              <span className="hidden xl:block">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          {session ? (
            <div className="flex flex-col gap-2">
              <Link href="/profil" className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-700 shrink-0 ring-2 ring-[#E4002B]/20">
                  {session.user?.image ? (
                    <Image src={session.user.image} alt="Avatar" width={40} height={40} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400">
                      {session.user?.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 hidden xl:block">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{session.user?.name || 'Utilisateur'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{session.user?.email}</p>
                </div>
              </Link>
              <Link href="/profil" className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-white bg-[#E4002B] hover:opacity-90 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                </svg>
                Voir mon profil
              </Link>
            </div>
          ) : (
            <Link href="/login" className="w-full flex items-center justify-center py-2 px-3 rounded-lg text-sm font-bold text-white bg-[#E4002B] hover:opacity-90 transition-opacity">
              Se connecter
            </Link>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT ─── */}
      <main className="flex-1 flex flex-col items-center h-full overflow-y-auto pb-24 lg:pb-0">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="px-4 pt-6 pb-0">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Communauté</h1>
            <div className="flex gap-0 bg-gray-100 dark:bg-white/5 rounded-2xl p-1 mb-5">
              {([
                { key: 'suivis', label: 'Suivis' },
                { key: 'me_suivent', label: 'Me suivent' },
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    tab === key
                      ? 'bg-white dark:bg-white text-gray-900 dark:text-black'
                      : 'text-gray-500 dark:text-white/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 flex flex-col gap-3">
            {tab === 'suivis'
              ? renderUserList(suivisList, loadingAmis, 'Tu ne suis personne encore')
              : renderUserList(followersList, loadingFollowers, 'Personne ne te suit encore')}
          </div>
        </div>
      </main>

      {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
      <BottomNav />
    </div>
  )
}