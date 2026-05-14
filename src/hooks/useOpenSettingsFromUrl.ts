'use client'

import { useEffect, useRef } from 'react'
import { useUserContext } from '@/context/user'

export const useOpenSettingsFromUrl = () => {
  const { setIsSettingsOpen } = useUserContext()
  const hasHandledRef = useRef(false)

  useEffect(() => {
    if (hasHandledRef.current) return
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    if (params.get('modal') !== 'settings') return

    hasHandledRef.current = true
    setIsSettingsOpen(true)

    params.delete('modal')
    const rest = params.toString()
    const newUrl = `${window.location.pathname}${rest ? `?${rest}` : ''}${window.location.hash}`
    window.history.replaceState(null, '', newUrl)
  }, [setIsSettingsOpen])
}
