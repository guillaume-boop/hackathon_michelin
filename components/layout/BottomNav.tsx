'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    icon: (active: boolean) => (
      // Fork & knife — feed
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'currentColor'} strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 3v6a3 3 0 0 0 6 0V3M10 9v12M19 3v18m-3-18v6h6V3" />
      </svg>
    ),
  },
  {
    href: '/decouvrir',
    icon: (active: boolean) => (
      // Loupe — explorer
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'currentColor'} strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
      </svg>
    ),
  },
  {
    href: '/amis',
    icon: (active: boolean) => (
      // People — amis
      <svg viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : 'currentColor'} strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    href: '/map',
    icon: (active: boolean) => (
      // Location pin — map
      <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
  },
  {
    href: '/profil',
    icon: (active: boolean) => (
      // Person — profil
      <svg viewBox="0 0 24 24" fill={active ? 'white' : 'none'} stroke={active ? 'white' : 'currentColor'} strokeWidth={1.8} className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm">
      <div className="flex items-center justify-around bg-neutral-900/95 backdrop-blur-xl rounded-full px-2 py-2 border border-white/[0.06] shadow-2xl">
        {tabs.map(({ href, icon }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-center"
            >
              <span
                className="flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200"
                style={isActive ? { background: '#E4002B' } : { color: 'rgba(255,255,255,0.35)' }}
              >
                {icon(isActive)}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
