'use client'

import { useEffect } from 'react'

const SERVICE_WORKER_URL = '/sw.js'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') return

    const registerServiceWorker = () => {
      navigator.serviceWorker
        .register(SERVICE_WORKER_URL, { scope: '/', updateViaCache: 'none' })
        .then((registration) => {
          registration.update().catch(() => undefined)
        })
        .catch(() => undefined)
    }

    if (document.readyState === 'complete') {
      registerServiceWorker()
      return
    }

    window.addEventListener('load', registerServiceWorker, { once: true })

    return () => window.removeEventListener('load', registerServiceWorker)
  }, [])

  return null
}
