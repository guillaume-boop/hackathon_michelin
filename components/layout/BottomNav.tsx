'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  {
    href: '/',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h2v12H3zm6 0h2v12H9zm6 0h2v12h-2zm6 0h2v12h-2z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 6h20v1H2z" />
      </svg>
    ),
    label: 'Feed',
  },
  {
    href: '/map',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.5c-5.24 0-9.5 4.03-9.5 9 0 6.5 9.5 12 9.5 12s9.5-5.5 9.5-12c0-4.97-4.26-9-9.5-9zm0 11a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
      </svg>
    ),
    label: 'Carte',
  },
  {
    href: '/amis',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
    label: 'Amis',
  },
  {
    href: '/profil',
    icon: (active: boolean) => (
      <svg viewBox="0 0 24 24" fill={active ? '#E4002B' : 'none'} stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
      </svg>
    ),
    label: 'Profil',
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-full py-2 shadow-lg border border-gray-200 dark:border-gray-800">
      <div className="flex items-stretch justify-around">
        {tabs.map(({ href, icon, label }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center py-2 transition-all duration-150 group ${
                isActive ? 'text-[#E4002B]' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <div className={`transition-transform duration-150 ${isActive ? 'scale-110' : 'scale-100 group-hover:scale-105'}`}>
                {icon(isActive)}
              </div>
              {/* <span className={`text-[10px] font-medium mt-1 transition-all duration-150 ${
                isActive ? 'opacity-100 text-[#E4002B]' : 'opacity-0 group-hover:opacity-100'
              }`}>
                {label}
              </span> */}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}