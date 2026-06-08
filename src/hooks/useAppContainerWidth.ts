'use client'

import { useEffect, useState } from 'react'

const APP_CONTAINER_SELECTOR = '[data-app-container="true"]'

export const useAppContainerWidth = () => {
  const [width, setWidth] = useState<number | null>(null)

  useEffect(() => {
    const container = document.querySelector<HTMLElement>(APP_CONTAINER_SELECTOR)
    if (!container) return

    const updateWidth = () => setWidth(container.getBoundingClientRect().width)
    updateWidth()

    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })

    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  return width
}
