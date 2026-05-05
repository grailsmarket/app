'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'
import { useUserContext } from '@/context/user'

export default function PostHogIdentify() {
  const { userAddress, authStatus } = useUserContext()

  useEffect(() => {
    if (!posthog.__loaded) return

    const persistedUserId = posthog.get_property('$user_id') as string | undefined

    if (authStatus === 'authenticated' && userAddress) {
      const distinctId = userAddress.toLowerCase()
      if (persistedUserId === distinctId) return
      if (persistedUserId) posthog.reset()
      posthog.identify(distinctId, { wallet_address: distinctId })
      return
    }

    if (authStatus === 'unauthenticated' && persistedUserId) {
      posthog.reset()
    }
  }, [authStatus, userAddress])

  return null
}
