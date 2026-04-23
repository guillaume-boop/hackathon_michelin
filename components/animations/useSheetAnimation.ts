import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function useSheetAnimation(isOpen: boolean, sheetRef: React.RefObject<HTMLElement>) {
  const tl = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    if (!sheetRef.current) return

    if (isOpen) {
      // Sheet is opening
      if (tl.current) tl.current.kill()

      tl.current = gsap.timeline()
      tl.current
        .fromTo(
          sheetRef.current.previousSibling, // backdrop
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
      // Sheet is closing
      if (tl.current) tl.current.kill()

      tl.current = gsap.timeline()
      tl.current
        .to(
          sheetRef.current.previousSibling, // backdrop
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
  }, [isOpen, sheetRef])
}
