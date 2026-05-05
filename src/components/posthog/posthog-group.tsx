'use client'

import posthog from 'posthog-js'
import { useEffect } from 'react'

type Props = {
  groupType: 'ens_name' | 'category' | 'profile'
  groupKey: string
}

export default function PostHogGroup({ groupType, groupKey }: Props) {
  useEffect(() => {
    if (!posthog.__loaded || !groupKey) return
    posthog.group(groupType, groupKey)
    return () => {
      posthog.resetGroups()
    }
  }, [groupType, groupKey])

  return null
}
