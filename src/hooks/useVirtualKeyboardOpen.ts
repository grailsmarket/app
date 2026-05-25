'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const KEYBOARD_THRESHOLD_PX = 150
const LISTENED_PATHS = ['/feed']

// Used to hide navbar on certain pages when the virtual keyboard is
// open on mobile to provide additional screen space
export const useVirtualKeyboardOpen = () => {
  const pathname = usePathname()
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
    if (!LISTENED_PATHS.includes(pathname)) return

    const vv = window.visualViewport

    const update = () => {
      setIsKeyboardOpen(window.innerHeight - vv.height > KEYBOARD_THRESHOLD_PX)
    }

    update()
    vv.addEventListener('resize', update)
    return () => {
      vv.removeEventListener('resize', update)
    }
  }, [pathname])

  return isKeyboardOpen
}
