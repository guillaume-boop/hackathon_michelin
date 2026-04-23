import { useEffect, useRef } from 'react'

export function useSheetAnimation(isOpen: boolean, sheetRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    // Animation disabled
  }, [isOpen, sheetRef])
}
