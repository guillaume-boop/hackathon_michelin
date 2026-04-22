import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/session'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex">
      <aside className="w-56 bg-neutral-900 border-r border-white/10 flex flex-col py-8 px-4 fixed h-full z-10">
        <div className="mb-8 px-2">
          <span className="text-[#E4002B] font-black text-lg tracking-tight">MICHELIN</span>
          <span className="block text-white/40 text-xs mt-0.5">Back office</span>
        </div>
        <nav className="flex flex-col gap-1">
          <Link
            href="/admin/restaurants"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            <span className="text-base">🍽</span>
            Restaurants
          </Link>
        </nav>
        <div className="mt-auto px-2">
          <div className="text-xs text-white/30 leading-relaxed">
            Signed in as<br />
            <span className="text-white/50 font-medium">{user.username}</span>
          </div>
        </div>
      </aside>
      <main className="ml-56 flex-1 p-8 min-h-screen">
        {children}
      </main>
    </div>
  )
}
