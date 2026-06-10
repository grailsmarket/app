'use client'

import { useSyncExternalStore } from 'react'
import { useAppContainerWidth } from './useAppContainerWidth'

type ViewportSize = {
  width: number
  height: number
}

let viewportSize: ViewportSize = { width: 0, height: 0 }
let isListening = false
const viewportListeners = new Set<() => void>()

const serverViewportSnapshot: ViewportSize = { width: 0, height: 0 }

const getViewportSnapshot = () => viewportSize
const getServerViewportSnapshot = () => serverViewportSnapshot

const notifyViewportListeners = () => {
  viewportListeners.forEach((listener) => listener())
}

const updateViewportSize = () => {
  const nextSize = { width: window.innerWidth, height: window.innerHeight }
  if (viewportSize.width === nextSize.width && viewportSize.height === nextSize.height) return
  viewportSize = nextSize
  notifyViewportListeners()
}

const startViewportListener = () => {
  if (typeof window === 'undefined' || isListening) return
  updateViewportSize()
  window.addEventListener('resize', updateViewportSize)
  isListening = true
}

const stopViewportListener = () => {
  if (typeof window === 'undefined' || !isListening) return
  window.removeEventListener('resize', updateViewportSize)
  isListening = false
  viewportSize = { width: 0, height: 0 }
}

const subscribeToViewport = (listener: () => void) => {
  viewportListeners.add(listener)
  if (viewportListeners.size === 1) startViewportListener()

  return () => {
    viewportListeners.delete(listener)
    if (viewportListeners.size === 0) stopViewportListener()
  }
}

export const useViewportSize = () => {
  return useSyncExternalStore(subscribeToViewport, getViewportSnapshot, getServerViewportSnapshot)
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
