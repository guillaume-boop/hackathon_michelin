import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function useTabAnimation(tabName: string, contentRef: React.RefObject<HTMLElement>) {
  const prevTabRef = useRef<string>(tabName)

  useEffect(() => {
    if (!contentRef.current) return

    const element = contentRef.current
    const isNew = prevTabRef.current !== tabName

    if (isNew) {
      // Exit animation for old content
      gsap.to(element, {
        opacity: 0,
        y: 20,
        duration: 0.2,
        onComplete: () => {
          // Entry animation for new content
          gsap.fromTo(
            element,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
          )
        },
      })

      prevTabRef.current = tabName
    }
  }, [tabName, contentRef])
}
