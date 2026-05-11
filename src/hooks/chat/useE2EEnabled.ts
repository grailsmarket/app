'use client'
import { useSearchParams } from 'next/navigation'
import { useFeatureFlagEnabled } from 'posthog-js/react'

// Two-source gate so we can roll out E2E gradually via PostHog while still
// letting individual users opt themselves in via `?e2e=1`. Either source is
// sufficient — the query param exists for internal dogfooding and for users
// who want to force-enable before the cohort rollout reaches them.
//
// `loading` is true while PostHog is fetching the flag value (it returns
// `undefined` in that window). Callers gating sensitive behavior — e.g.
// pausing the composer to avoid plaintext fallback — should treat loading
// as "possibly enabled" until proven otherwise. The query-param branch
// short-circuits loading because we can decide it locally.
//
// If PostHog isn't configured at all (no NEXT_PUBLIC_POSTHOG_KEY / HOST —
// see instrumentation-client.ts), `posthog.init` never runs and
// `useFeatureFlagEnabled` returns `undefined` forever. We must NOT treat
// that as "loading" — doing so would permanently disable the composer for
// every direct chat in dev, self-hosted, and CI environments. Detect the
// absent config and short-circuit to `loading: false, enabled: false`.

const POSTHOG_CONFIGURED =
  !!process.env.NEXT_PUBLIC_POSTHOG_KEY && !!process.env.NEXT_PUBLIC_POSTHOG_HOST

export function useE2EEnabled(): { enabled: boolean; loading: boolean } {
  const search = useSearchParams()
  const queryParamEnabled = search?.get('e2e') === '1'
  const flagValue = useFeatureFlagEnabled('e2e')
  const loading = !queryParamEnabled && POSTHOG_CONFIGURED && flagValue === undefined
  return {
    enabled: queryParamEnabled || (POSTHOG_CONFIGURED && flagValue === true),
    loading,
  }
}
