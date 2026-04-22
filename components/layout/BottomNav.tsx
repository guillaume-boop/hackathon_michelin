'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke="white" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h2v12H3zm6 0h2v12H9zm6 0h2v12h-2zm6 0h2v12h-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6h20v1H2z" />
      </svg>
    ),
  },
  {
    href: '/map',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke="white" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5c-5.24 0-9.5 4.03-9.5 9 0 6.5 9.5 12 9.5 12s9.5-5.5 9.5-12c0-4.97-4.26-9-9.5-9zm0 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
      </svg>
    ),
  },
  {
    href: '/amis',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke="white" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    href: '/profil',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke="white" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg bg-black/80 backdrop-blur-xl rounded-2xl border border-white/[0.08]">
      <div className="flex items-stretch justify-around">
        {tabs.map(({ href, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex items-center justify-center py-3 transition-opacity duration-150 ${isActive ? 'opacity-100' : 'opacity-40'}`}
            >
              {icon(isActive)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
