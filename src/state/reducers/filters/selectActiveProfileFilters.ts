import type { RootState } from '@/state'
import type { ProfileFilters } from './profileFilters'

export const selectActiveProfileFilters = (state: RootState): ProfileFilters | undefined => {
  const { activeProfileId, byProfile } = state.filters.profileFilters
  return activeProfileId ? byProfile[activeProfileId] : undefined
}
