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
  const { isKeyboardOpen } = useNavbar()

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return
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
  }, [])

  const navOffset = viewport ? (isKeyboardOpen ? 0 : getNavOffset()) : 0
  const viewportStyle = viewport
    ? {
        height: `${Math.max(0, viewport.height - navOffset)}px`,
        top: `${viewport.offsetTop + navOffset}px`,
      }
    : undefined

  return { viewport, viewportStyle }
}
