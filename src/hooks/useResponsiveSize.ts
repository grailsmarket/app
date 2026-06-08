'use client'

import { useState, useEffect } from 'react'
import { useAppContainerWidth } from './useAppContainerWidth'

const useViewportSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

export const useResponsiveSize = () => {
  const { width: windowWidth, height } = useViewportSize()
  const appContainerWidth = useAppContainerWidth()

  return {
    width: appContainerWidth ?? windowWidth,
    height,
    windowWidth,
    appContainerWidth,
  }
}
