import { useEffect, useRef } from 'react'

export function useTabAnimation(tabName: string, contentRef: React.RefObject<HTMLElement>) {
  const prevTabRef = useRef<string>(tabName)

  useEffect(() => {
    // Animation disabled
    prevTabRef.current = tabName
  }, [tabName, contentRef])
}
