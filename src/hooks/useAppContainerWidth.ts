'use client'

import { useSyncExternalStore } from 'react'

const APP_CONTAINER_SELECTOR = '[data-app-container="true"]'

let appContainerWidth: number | null = null
let resizeObserver: ResizeObserver | null = null
let mutationObserver: MutationObserver | null = null
const listeners = new Set<() => void>()

const getSnapshot = () => appContainerWidth
const getServerSnapshot = () => null

const notify = () => {
  listeners.forEach((listener) => listener())
}

const setWidth = (nextWidth: number | null) => {
  if (appContainerWidth === nextWidth) return
  appContainerWidth = nextWidth
  notify()
}

const observeContainer = (container: HTMLElement) => {
  mutationObserver?.disconnect()
  mutationObserver = null

  setWidth(container.getBoundingClientRect().width)

  if (typeof ResizeObserver === 'undefined') return

  resizeObserver = new ResizeObserver(([entry]) => {
    setWidth(entry.contentRect.width)
  })

  resizeObserver.observe(container)
}

const startObserving = () => {
  if (typeof document === 'undefined' || resizeObserver || mutationObserver) return

  const container = document.querySelector<HTMLElement>(APP_CONTAINER_SELECTOR)
  if (container) {
    observeContainer(container)
    return
  }

  mutationObserver = new MutationObserver(() => {
    const nextContainer = document.querySelector<HTMLElement>(APP_CONTAINER_SELECTOR)
    if (nextContainer) observeContainer(nextContainer)
  })

  mutationObserver.observe(document.documentElement, { childList: true, subtree: true })
}

const stopObserving = () => {
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  resizeObserver = null
  mutationObserver = null
  setWidth(null)
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  if (listeners.size === 1) startObserving()

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stopObserving()
  }
}

export const useAppContainerWidth = () => {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
