'use client'

import { useState, useEffect } from 'react'

export default function LoadingScreen() {
  const [isLight, setIsLight] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    setIsLight(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsLight(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  return (
    <div
      className="flex items-center justify-center min-h-dvh"
      style={{ background: isLight ? '#F5F5F5' : '#000' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/icons/etoile-michelin.svg"
        alt=""
        className="w-12 h-12"
        style={{ animation: 'spin 1.2s linear infinite' }}
      />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
