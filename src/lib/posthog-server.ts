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

export async function captureListingCreated(params: {
  seller_address: string | null
  marketplace: string
  domain_count: number
  currencies: (string | undefined)[]
  brokered?: boolean
}) {
  if (!params.seller_address) return
  const posthog = createPostHogServerClient()
  if (!posthog) return
  try {
    posthog.capture({
      distinctId: params.seller_address,
      event: 'listing_created',
      properties: {
        marketplace: params.marketplace,
        domain_count: params.domain_count,
        currencies: params.currencies.filter(Boolean),
        brokered: params.brokered ?? false,
        $process_person_profile: false,
      },
    })
    await posthog.shutdown(2000)
  } catch (err) {
    console.error('analytics failed:', err)
  }
}
