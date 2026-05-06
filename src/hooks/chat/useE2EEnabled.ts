'use client'
import { useSearchParams } from 'next/navigation'
import { useFeatureFlagEnabled } from 'posthog-js/react'

// Two-source gate so we can roll out E2E gradually via PostHog while still
// letting individual users opt themselves in via `?e2e=1`. Either source is
// sufficient — the query param exists for internal dogfooding and for users
// who want to force-enable before the cohort rollout reaches them.
export function useE2EEnabled(): boolean {
  const search = useSearchParams()
  const queryParamEnabled = search?.get('e2e') === '1'
  const flagEnabled = useFeatureFlagEnabled('e2e')
  return queryParamEnabled || !!flagEnabled
}
