import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import SignOutButton from './sign-out-button'

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single()

  return (
    <div className="min-h-screen bg-neutral-950 p-6">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-sm">
              {user?.username?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div>
              <p className="font-semibold text-white">{user?.username ?? '—'}</p>
              <p className="text-neutral-400 text-xs">{session.user.email}</p>
            </div>
          </div>
          <SignOutButton />
        </div>

        {/* Circle Score */}
        <div className="bg-neutral-900 rounded-2xl p-5 mb-6 border border-neutral-800">
          <p className="text-neutral-400 text-xs uppercase tracking-widest mb-1">Circle Score</p>
          <p className="text-4xl font-bold text-white">{user?.circle_score ?? 0}</p>
          <p className="text-neutral-500 text-xs mt-1">
            Rôle : <span className="text-neutral-300 capitalize">{user?.role ?? '—'}</span>
            {' · '}
            ID : <span className="font-mono">{session.user.id.slice(0, 8)}…</span>
          </p>
        </div>

        {/* API quick links */}
        <div className="bg-neutral-900 rounded-2xl p-5 border border-neutral-800">
          <p className="text-neutral-400 text-xs uppercase tracking-widest mb-4">Routes API</p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Health check', url: '/api/health' },
              { label: 'Restaurants', url: '/api/restaurants' },
              { label: 'Feed', url: '/api/feed' },
              { label: 'Mes expériences', url: `/api/experiences?user_id=${session.user.id}` },
              { label: 'Mes circles', url: '/api/circles' },
              { label: 'Chefs', url: '/api/chefs' },
              { label: 'Map amis', url: '/api/map/friends' },
            ].map(({ label, url }) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors text-sm"
              >
                <span className="text-white">{label}</span>
                <span className="text-neutral-500 font-mono text-xs">{url.split('?')[0]}</span>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
