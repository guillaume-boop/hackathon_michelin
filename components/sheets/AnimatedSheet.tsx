'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface AnimatedSheetProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function AnimatedSheet({ isOpen, onClose, children }: AnimatedSheetProps) {
  const backdropRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const tl = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!backdropRef.current || !sheetRef.current) return

    if (isOpen) {
      // Animation d'ouverture
      if (tl.current) tl.current.kill()

      tl.current = gsap.timeline()
      tl.current
        .fromTo(
          backdropRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.2 },
          0
        )
        .fromTo(
          sheetRef.current,
          { y: '100%' },
          { y: '0%', duration: 0.4, ease: 'power2.out' },
          0
        )
    } else {
      // Animation de fermeture
      if (tl.current) tl.current.kill()

      tl.current = gsap.timeline({
        onComplete: () => {
          // Reset après l'animation
          gsap.set(sheetRef.current, { y: '100%' })
          gsap.set(backdropRef.current, { opacity: 0 })
        },
      })
      tl.current
        .to(
          backdropRef.current,
          { opacity: 0, duration: 0.2 },
          0
        )
        .to(
          sheetRef.current,
          { y: '100%', duration: 0.3, ease: 'power2.in' },
          0
        )
    }

    return () => {
      if (tl.current) tl.current.kill()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div ref={sheetRef} className="relative bg-neutral-950 rounded-t-3xl overflow-hidden max-h-[88dvh] flex flex-col">
        {children}
      </div>
    </div>
  )
}
