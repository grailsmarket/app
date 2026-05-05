'use client'

import posthog from 'posthog-js'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

type Group = { type: 'ens_name' | 'category' | 'profile'; key: string }

function deriveGroup(pathname: string): Group | null {
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length === 1) {
    const decoded = decodeURIComponent(segments[0])
    if (decoded.includes('.eth')) return { type: 'ens_name', key: decoded }
    return null
  }
  if (segments.length === 2) {
    if (segments[0] === 'categories') {
      return { type: 'category', key: decodeURIComponent(segments[1]) }
    }
    if (segments[0] === 'profile') {
      return { type: 'profile', key: decodeURIComponent(segments[1]).toLowerCase() }
    }
  }
  return null
}

export function applyGroupForPathname(pathname: string) {
  if (!posthog.__loaded || !pathname) return
  const group = deriveGroup(pathname)
  if (group) {
    posthog.group(group.type, group.key)
  } else {
    posthog.resetGroups()
  }
}

export default function PostHogGroupSync() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return
    applyGroupForPathname(pathname)
  }, [pathname])

  return null
}
