'use client'

import posthog from 'posthog-js'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { useUserContext } from '@/context/user'
import { applyGroupForPathname } from './posthog-group-sync'

export default function PostHogIdentify() {
  const { userAddress, authStatus } = useUserContext()
  const pathname = usePathname()

  useEffect(() => {
    if (!posthog.__loaded) return

    const persistedUserId = posthog.get_property('$user_id') as string | undefined

    if (authStatus === 'authenticated' && userAddress) {
      const distinctId = userAddress.toLowerCase()
      if (persistedUserId === distinctId) return
      if (persistedUserId) {
        posthog.reset()
        if (pathname) applyGroupForPathname(pathname)
      }
      posthog.identify(distinctId, { wallet_address: distinctId })
      return
    }

    if (authStatus === 'unauthenticated' && persistedUserId) {
      posthog.reset()
      if (pathname) applyGroupForPathname(pathname)
    }
  }, [authStatus, userAddress, pathname])

  return null
}
