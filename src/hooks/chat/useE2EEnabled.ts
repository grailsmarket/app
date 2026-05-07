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
export function useE2EEnabled(): { enabled: boolean; loading: boolean } {
  const search = useSearchParams()
  const queryParamEnabled = search?.get('e2e') === '1'
  const flagValue = useFeatureFlagEnabled('e2e')
  const loading = !queryParamEnabled && flagValue === undefined
  return {
    enabled: queryParamEnabled || flagValue === true,
    loading,
  }
}
