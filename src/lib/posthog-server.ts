import 'server-only'
import { PostHog } from 'posthog-node'

export function createPostHogServerClient(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST
  if (!key || !host) return null
  return new PostHog(key, {
    host,
    flushAt: 1,
    flushInterval: 0,
  })
}
