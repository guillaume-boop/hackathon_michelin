'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import BottomNav from '@/components/layout/BottomNav'
import AuthGateModal from '@/components/ui/AuthGateModal'
import CircleScore from '@/components/ui/CircleScore'

type UserProfile = {
  id: string
  username: string
  avatar_url: string | null
  role: string
  circle_score: number
}

type Experience = {
  id: string
  rating: number
  note: string | null
  visited_at: string
  restaurant_id: string
  restaurants: { id: string; name: string; city: string; michelin_stars: number } | null
}

type ContentItem = {
  type: 'feed' | 'experience'
  id: string
  restaurant_id: string
  content_url?: string | null
  rating?: number
  note?: string | null
  visited_at?: string
  created_at?: string
  likes_count?: number
  restaurants: { id: string; name: string; description?: string | null } | null
}

type Tab = 'posts' | 'likes' | 'saved'

export default function ProfilPage() {
  const { data: session } = useSession()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('posts')
  const [selected, setSelected] = useState<Experience | null>(null)
  const [selectedFeed, setSelectedFeed] = useState<ContentItem | null>(null)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [liked, setLiked] = useState<ContentItem[]>([])
  const [saved, setSaved] = useState<ContentItem[]>([])

  const handleItemSelect = (item: ContentItem) => {
    if (item.type === 'feed') setSelectedFeed(item)
    else setSelected(item as unknown as Experience)
  }

  useEffect(() => {
    if (!session?.user?.id) { setLoading(false); return }
    const id = session.user.id
    Promise.all([
      fetch(`/api/users/${id}`).then(r => r.json()),
      fetch(`/api/experiences?user_id=${id}`).then(r => r.json()),
      fetch(`/api/users/${id}/followers`).then(r => r.json()),
      fetch(`/api/users/${id}/following`).then(r => r.json()),
      fetch(`/api/users/${id}/likes`).then(r => r.json()),
      fetch(`/api/users/${id}/bookmarks`).then(r => r.json()),
    ]).then(([user, exps, followers, following, likes, bookmarks]) => {
      setProfile(user)
      setExperiences(Array.isArray(exps) ? exps : [])
      setFollowersCount(Array.isArray(followers) ? followers.length : 0)
      setFollowingCount(Array.isArray(following) ? following.length : 0)
      setLiked(Array.isArray(likes) ? likes : [])
      setSaved(Array.isArray(bookmarks) ? bookmarks : [])
    }).finally(() => setLoading(false))
  }, [session])

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-black gap-6 px-6 text-center pb-24">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-3xl border border-white/10">👤</div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Mon profil</h2>
          <p className="text-white/40 text-sm">Connecte-toi pour accéder à ton profil.</p>
        </div>
        <button onClick={() => setShowAuthGate(true)} className="px-8 py-3.5 rounded-2xl text-white font-semibold" style={{ background: '#E4002B' }}>
          Se connecter
        </button>
        {showAuthGate && <AuthGateModal onClose={() => setShowAuthGate(false)} />}
        <BottomNav />
      </div>
    )
  }



  const avatarUrl = profile?.avatar_url ?? `https://picsum.photos/seed/${profile?.username ?? 'user'}/200/200`
  const roleLabel = (() => {
    const role = profile?.role
    const score = profile?.circle_score ?? 0
    if (role === 'chef') return 'Chef'
    if (role === 'restaurateur') return 'Restaurateur'
    if (role === 'inspecteur') return 'Inspecteur'
    if (score >= 200) return 'Grand Gourmet'
    if (score >= 100) return 'Gourmet'
    if (score >= 50) return 'Gastronome'
    if (score >= 20) return 'Amateur éclairé'
    return 'Curieux'
  })()

  return (
    <div className="flex flex-col bg-black min-h-dvh pb-28">

      {/* ── Header Instagram ──────────────────── */}
      <div className="px-4 pt-8">

        {/* Top bar: username + logout */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-black text-white">@{profile?.username ?? session.user?.name}</h1>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40 text-xs font-medium"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Déconnexion
          </button>
        </div>

        {/* Avatar + nom/rôle à gauche | stats à droite */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/10 bg-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-xs leading-tight">@{profile?.username ?? session.user?.name}</p>
              <p className="text-white/40 text-[10px] mt-0.5">{roleLabel}</p>
            </div>
          </div>
          <div className="flex flex-1 justify-around">
            {[
              { label: 'Posts', value: experiences.length },
              { label: 'Abonnés', value: followersCount },
              { label: 'Abonnements', value: followingCount },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-white font-black text-lg leading-none">{loading ? '—' : value}</span>
                <span className="text-white/40 text-[11px]">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Circle Score */}
        <div className="flex justify-center mb-4">
          <CircleScore score={profile?.circle_score ?? 0} />
        </div>

        {/* Edit profile */}
        <button className="w-full py-2 rounded-xl border border-white/15 text-white text-sm font-semibold mb-4 active:bg-white/5 transition-colors">
          Modifier le profil
        </button>
      </div>

      {/* ── Tab bar ──────────────────────────── */}
      <div className="flex border-t border-b border-white/[0.08]">
        {([
          { key: 'posts', icon: <GridIcon /> },
          { key: 'likes', icon: <HeartIcon /> },
          { key: 'saved', icon: <BookmarkIcon /> },
        ] as const).map(({ key, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center py-3 transition-opacity ${tab === key ? 'opacity-100 border-t-2 border-white' : 'opacity-30'}`}
          >
            {icon}
          </button>
        ))}
      </div>

      {/* ── Grid posts ───────────────────────── */}
      {tab === 'posts' && (
        loading ? (
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : experiences.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
            <span className="text-4xl">🍽️</span>
            <p className="text-white font-semibold text-sm">Aucune expérience</p>
            <p className="text-white/30 text-xs">Tes visites de restaurants apparaîtront ici.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5">
            {experiences.map(exp => {
              const seed = exp.restaurant_id.replace(/-/g, '').slice(0, 8)
              const img = `https://picsum.photos/seed/${seed}food/300/300`
              return (
                <button
                  key={exp.id}
                  onClick={() => setSelected(exp)}
                  className="aspect-square relative overflow-hidden bg-neutral-900 active:opacity-80 transition-opacity"
                >
                  <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-1.5 left-1.5 flex gap-0.5">
                    {Array.from({ length: exp.rating }).map((_, i) => (
                      <span key={i} className="text-[8px]" style={{ color: '#C9AA71' }}>★</span>
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        )
      )}

      {tab === 'likes' && (
        liked.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
            <HeartIconLg />
            <p className="text-white font-semibold text-sm">Aucun like</p>
            <p className="text-white/30 text-xs">Les posts et expériences que tu aimes apparaîtront ici.</p>
          </div>
        ) : (
          <ContentGrid items={liked} onSelect={handleItemSelect} />
        )
      )}

      {tab === 'saved' && (
        saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-8">
            <BookmarkIconLg />
            <p className="text-white font-semibold text-sm">Aucun enregistrement</p>
            <p className="text-white/30 text-xs">Les posts et expériences sauvegardés apparaîtront ici.</p>
          </div>
        ) : (
          <ContentGrid items={saved} onSelect={handleItemSelect} />
        )
      )}

      {selected && (
        <ExperienceSheet
          exp={selected}
          profile={profile}
          avatarUrl={avatarUrl}
          roleLabel={roleLabel}
          onClose={() => setSelected(null)}
        />
      )}

      {selectedFeed && (
        <FeedSheet
          item={selectedFeed}
          onClose={() => setSelectedFeed(null)}
        />
      )}

      {!selected && !selectedFeed && <BottomNav />}
    </div>
  )
}

// ── Experience bottom sheet ───────────────────────────────────────────────────

function ExperienceSheet({
  exp, profile, avatarUrl, roleLabel, onClose,
}: {
  exp: Experience
  profile: UserProfile | null
  avatarUrl: string
  roleLabel: string
  onClose: () => void
}) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [saved, setSaved] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/experiences/${exp.id}/like`).then(r => r.json()),
      fetch(`/api/experiences/${exp.id}/bookmark`).then(r => r.json()),
    ]).then(([likeData, bookmarkData]) => {
      setLiked(!!likeData.liked)
      setLikeCount(likeData.count ?? 0)
      setSaved(!!bookmarkData.saved)
    })
  }, [exp.id])

  const seed = exp.restaurant_id.replace(/-/g, '').slice(0, 8)
  const img = `https://picsum.photos/seed/${seed}food/600/600`
  const date = new Date(exp.visited_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  const likedByText = liked
    ? likeCount === 1
      ? 'Aimé par toi'
      : `Aimé par toi et ${likeCount - 1} autre${likeCount > 2 ? 's' : ''}`
    : likeCount > 0
      ? `${likeCount} j'aime`
      : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div ref={sheetRef} className="relative bg-neutral-950 rounded-t-3xl overflow-hidden max-h-[88dvh] flex flex-col">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        <div className="overflow-y-auto">
          {/* Header: avatar + nom + rôle */}
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm">@{profile?.username}</p>
              <p className="text-white/40 text-xs">{roleLabel}</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Image */}
          <div className="w-full aspect-square bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />

          {/* Actions + infos */}
          <div className="px-4 py-3">

            {/* Boutons like + save */}
            <div className="flex items-center gap-4 mb-2">
              <button
                onClick={() => {
                  const next = !liked
                  setLiked(next)
                  setLikeCount(c => next ? c + 1 : c - 1)
                  fetch(`/api/experiences/${exp.id}/like`, { method: next ? 'POST' : 'DELETE' })
                }}
                className="active:scale-90 transition-transform"
              >
                <svg viewBox="0 0 24 24" fill={liked ? '#E4002B' : 'none'} stroke={liked ? '#E4002B' : 'white'} strokeWidth={1.5} className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
              </button>
              <button
                onClick={() => {
                  const next = !saved
                  setSaved(next)
                  fetch(`/api/experiences/${exp.id}/bookmark`, { method: next ? 'POST' : 'DELETE' })
                }}
                className="active:scale-90 transition-transform">
                <svg viewBox="0 0 24 24" fill={saved ? 'white' : 'none'} stroke="white" strokeWidth={1.5} className="w-7 h-7">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
                </svg>
              </button>
            </div>

            {/* Liked by */}
            {likedByText && (
              <p className="text-white text-sm font-semibold mb-1">{likedByText}</p>
            )}

            {/* Restaurant + étoiles */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-white font-black text-sm">{exp.restaurants?.name ?? 'Restaurant'}</span>
              <span className="text-white/30">·</span>
              <span className="flex gap-0.5">
                {Array.from({ length: exp.rating }).map((_, i) => (
                  <span key={i} className="text-xs" style={{ color: '#C9AA71' }}>★</span>
                ))}
              </span>
            </div>

            {/* Note */}
            {exp.note && (
              <p className="text-white/70 text-sm mb-2 leading-snug">&ldquo;{exp.note}&rdquo;</p>
            )}

            {/* Date */}
            <p className="text-white/30 text-xs">{date}</p>

          </div>
        </div>
      </div>
    </div>
  )
}

// ── Feed bottom sheet ─────────────────────────────────────────────────────────

function FeedSheet({ item, onClose }: { item: ContentItem; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(item.likes_count ?? 0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/feed/posts/${item.id}/like`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/feed/posts/${item.id}/bookmark`).then(r => r.json()).catch(() => ({})),
    ]).then(([likeData, bookmarkData]) => {
      setLiked(!!likeData.liked)
      if (likeData.count !== undefined) setLikeCount(likeData.count)
      setSaved(!!bookmarkData.saved)
    })
    videoRef.current?.play().catch(() => {})
  }, [item.id])

  const seed = item.restaurant_id.replace(/-/g, '').slice(0, 8)
  const date = item.created_at
    ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const likedByText = liked
    ? likeCount === 1
      ? 'Aimé par toi'
      : `Aimé par toi et ${likeCount - 1} autre${likeCount > 2 ? 's' : ''}`
    : likeCount > 0
      ? `${likeCount} j'aime`
      : null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-neutral-950 rounded-t-3xl overflow-hidden max-h-[92dvh] flex flex-col">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header: restaurant + close */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl bg-cover bg-center flex-shrink-0"
            style={{ backgroundImage: `url(https://picsum.photos/seed/${seed}food/80/80)` }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{item.restaurants?.name ?? 'Restaurant'}</p>
            <p className="text-white/40 text-xs">Vidéo du restaurant</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Vidéo portrait */}
        <div className="relative bg-black overflow-hidden flex-shrink-0" style={{ aspectRatio: '9/16', maxHeight: '60dvh' }}>
          {item.content_url ? (
            <video
              ref={videoRef}
              src={item.content_url}
              className="w-full h-full object-cover"
              loop
              muted
              playsInline
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-10">🎬</span>
            </div>
          )}
        </div>

        {/* Actions + infos */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className="flex items-center gap-4 mb-2">
            <button
              onClick={() => {
                const next = !liked
                setLiked(next)
                setLikeCount(c => next ? c + 1 : c - 1)
                fetch(`/api/feed/posts/${item.id}/like`, { method: next ? 'POST' : 'DELETE' })
              }}
              className="active:scale-90 transition-transform"
            >
              <svg viewBox="0 0 24 24" fill={liked ? '#E4002B' : 'none'} stroke={liked ? '#E4002B' : 'white'} strokeWidth={1.5} className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
              </svg>
            </button>
            <button
              onClick={() => {
                const next = !saved
                setSaved(next)
                fetch(`/api/feed/posts/${item.id}/bookmark`, { method: next ? 'POST' : 'DELETE' })
              }}
              className="active:scale-90 transition-transform"
            >
              <svg viewBox="0 0 24 24" fill={saved ? 'white' : 'none'} stroke="white" strokeWidth={1.5} className="w-7 h-7">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
            </button>
          </div>

          {likedByText && (
            <p className="text-white text-sm font-semibold mb-1">{likedByText}</p>
          )}

          <p className="text-white font-black text-sm mb-0.5">{item.restaurants?.name ?? 'Restaurant'}</p>
          {item.restaurants?.description && (
            <p className="text-white/60 text-xs leading-snug mb-1.5 line-clamp-2">{item.restaurants.description}</p>
          )}
          {date && <p className="text-white/30 text-xs">{date}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Content grid (likes / saved) ─────────────────────────────────────────────

function ContentGrid({ items, onSelect }: { items: ContentItem[]; onSelect: (item: ContentItem) => void }) {
  return (
    <div className="grid grid-cols-3 gap-0.5">
      {items.map(item => {
        const seed = item.restaurant_id.replace(/-/g, '').slice(0, 8)
        const img = `https://picsum.photos/seed/${seed}food/300/300`
        return (
          <button
            key={`${item.type}-${item.id}`}
            onClick={() => onSelect(item)}
            className="aspect-square relative overflow-hidden bg-neutral-900 active:opacity-80 transition-opacity"
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img})` }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            {/* Badge type */}
            <div className="absolute top-1.5 right-1.5">
              {item.type === 'feed' ? (
                <div className="w-5 h-5 rounded-full bg-black/50 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-2.5 h-2.5 ml-0.5">
                    <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11V15.89a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
                  </svg>
                </div>
              ) : (
                <div className="flex gap-0.5">
                  {Array.from({ length: item.rating ?? 0 }).map((_, i) => (
                    <span key={i} className="text-[8px]" style={{ color: '#C9AA71' }}>★</span>
                  ))}
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ── Icônes ────────────────────────────────────────────────────────────────────

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M3 3h7v7H3zm0 11h7v7H3zm11-11h7v7h-7zm0 11h7v7h-7z" opacity={0.9} />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
  )
}

function HeartIconLg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1} className="w-12 h-12 opacity-10">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
    </svg>
  )
}

function BookmarkIconLg() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1} className="w-12 h-12 opacity-10">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
  )
}
