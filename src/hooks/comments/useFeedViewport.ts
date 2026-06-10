'use client'

import { useEffect, useState } from 'react'
import { useNavbar } from '@/context/navbar'

interface ViewportState {
  height: number
  offsetTop: number
}

const getNavOffset = () => (window.matchMedia('(min-width: 768px)').matches ? 70 : 54)

export const useFeedViewport = () => {
  const [viewport, setViewport] = useState<ViewportState | null>(null)
  const [isDesktop, setIsDesktop] = useState<boolean | null>(null)
  const { hideWhenKeyboardOpen } = useNavbar()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const mql = window.matchMedia('(min-width: 768px)')
    setIsDesktop(mql.matches)
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || isDesktop !== false || !window.visualViewport) {
      setViewport(null)
      return
    }

    const vv = window.visualViewport
    const update = () => {
      setViewport({ height: vv.height, offsetTop: vv.offsetTop })
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [isDesktop])

  const navOffset = viewport ? (hideWhenKeyboardOpen ? 0 : getNavOffset()) : 0
  const viewportStyle =
    viewport && !isDesktop
      ? {
          height: `${Math.max(0, viewport.height - navOffset)}px`,
          top: `${viewport.offsetTop + navOffset}px`,
        }
      : undefined

  return { viewport, viewportStyle }
}
