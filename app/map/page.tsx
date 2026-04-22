'use client'

import { useState, useEffect } from 'react'
import BottomNav from '@/components/layout/BottomNav'
import MapClient from './MapClient'

export default function MapPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <div className="relative bg-black" style={{ height: '100dvh' }}>
      <div className="absolute inset-0 bottom-20">
        {mounted && <MapClient />}
      </div>
      <BottomNav />
    </div>
  )
}
