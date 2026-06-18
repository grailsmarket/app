'use client'

import { useEffect, useState } from 'react'
import { authFetch } from '@/api/authFetch'

type ProtectedImageStatus = 'loading' | 'loaded' | 'error' | 'expired'

interface ProtectedImage {
  src: string | null
  status: ProtectedImageStatus
}

/**
 * Load an auth-gated chat image (DM/group) by fetching the bytes with the bearer
 * token and exposing them as an object URL. Pass `null` to skip — global-chat
 * images are public and load directly via <img src>. Revokes the object URL on
 * unmount / url change.
 */
export const useProtectedImage = (url: string | null): ProtectedImage => {
  const [state, setState] = useState<ProtectedImage>({ src: null, status: 'loading' })

  useEffect(() => {
    if (!url) {
      setState({ src: null, status: 'loading' })
      return
    }

    let objectUrl: string | null = null
    let cancelled = false
    const controller = new AbortController()
    setState({ src: null, status: 'loading' })

    authFetch(url, { signal: controller.signal })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 410) return setState({ src: null, status: 'expired' })
        if (!res.ok) return setState({ src: null, status: 'error' })
        const blob = await res.blob()
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setState({ src: objectUrl, status: 'loaded' })
      })
      .catch(() => {
        if (!cancelled) setState({ src: null, status: 'error' })
      })

    return () => {
      cancelled = true
      controller.abort()
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [url])

  return state
}
