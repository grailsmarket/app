'use client'

import posthog from 'posthog-js'
import { useEffect, useRef } from 'react'
import { useUserContext } from '@/context/user'

export default function PostHogIdentify() {
  const { userAddress, authStatus } = useUserContext()
  const lastId = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!posthog.__loaded) return

    if (authStatus === 'authenticated' && userAddress) {
      const distinctId = userAddress.toLowerCase()
      if (lastId.current !== distinctId) {
        if (lastId.current) posthog.reset()
        posthog.identify(distinctId, { wallet_address: distinctId })
        lastId.current = distinctId
      }
      return
    }

    if (lastId.current) {
      posthog.reset()
      lastId.current = undefined
    }
  }, [authStatus, userAddress])

  return null
}
