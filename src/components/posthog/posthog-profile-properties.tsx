'use client'

import posthog from 'posthog-js'
import { useEffect, useRef } from 'react'
import { useUserContext } from '@/context/user'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'

export default function PostHogProfileProperties() {
  const { userAddress, authStatus, watchlist, isPoapClaimed, poapClaimedYear } = useUserContext()
  const profile = useAppSelector(selectUserProfile)
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    if (!posthog.__loaded) return

    if (authStatus !== 'authenticated' || !userAddress) {
      lastKey.current = null
      return
    }

    const properties = {
      user_id: profile.userId,
      ens_name: profile.ensProfile.name,
      email_verified: profile.email.verified,
      has_discord: !!profile.discord,
      has_telegram: !!profile.telegram,
      poap_claimed: isPoapClaimed,
      poap_claimed_year: poapClaimedYear ?? null,
      watchlist_count: watchlist?.length ?? 0,
      offer_notification_threshold: profile.offerNotificationThreshold,
      notify_on_listing_sold: profile.notifyOnListingSold,
      notify_on_offer_received: profile.notifyOnOfferReceived,
      notify_on_comment_received: profile.notifyOnCommentReceived,
    }

    const key = `${userAddress.toLowerCase()}|${JSON.stringify(properties)}`
    if (lastKey.current === key) return
    lastKey.current = key

    posthog.setPersonProperties(properties)
  }, [authStatus, userAddress, profile, isPoapClaimed, poapClaimedYear, watchlist])

  return null
}
