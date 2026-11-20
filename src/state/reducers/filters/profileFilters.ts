import { combineReducers, createAction, type UnknownAction } from '@reduxjs/toolkit'
import type { Address } from 'viem'
import type { ProfileTabType } from '../portfolio/profile'
import profileDomainsFilters from './profileDomainsFilters'
import profileListingsFilters from './profileListingsFilter'
import profileGraceFilters from './profileGraceFilters'
import profileExpiredFilters from './profileExpiredFilters'
import profileActivityFilters from './profileActivityFilters'
import watchlistFilters from './watchlistFilters'
import myOffersFilters from './myOffersFilters'
import receivedOffersFilters from './receivedOffersFilters'

const profileFiltersReducer = combineReducers({
  domains: profileDomainsFilters,
  listings: profileListingsFilters,
  grace: profileGraceFilters,
  expired: profileExpiredFilters,
  activity: profileActivityFilters,
  watchlist: watchlistFilters,
  sent_offers: myOffersFilters,
  received_offers: receivedOffersFilters,
})

export type ProfileFilters = ReturnType<typeof profileFiltersReducer>

interface ProfileFiltersState {
  activeProfileId: Address | null
  byProfile: Partial<Record<Address, ProfileFilters>>
}

const initialState: ProfileFiltersState = { activeProfileId: null, byProfile: {} }

const defaults = profileFiltersReducer(undefined, { type: '@@INIT' })

export const openProfileFilters = createAction<{ address: Address; resetTab?: ProfileTabType['value'] }>(
  'profileFilters/open'
)

export default function reducer(state = initialState, action: UnknownAction): ProfileFiltersState {
  if (openProfileFilters.match(action)) {
    const { address, resetTab } = action.payload
    const id = address.toLowerCase() as Address
    const previous = state.byProfile[id] ?? defaults
    const filters = resetTab && resetTab !== 'broker' ? { ...previous, [resetTab]: defaults[resetTab] } : previous
    return { activeProfileId: id, byProfile: { ...state.byProfile, [id]: filters } }
  }

  if (!state.activeProfileId) return state

  const currentFilters = state.byProfile[state.activeProfileId]
  const nextFilters = profileFiltersReducer(currentFilters, action)
  if (nextFilters === currentFilters) return state

  return {
    ...state,
    byProfile: { ...state.byProfile, [state.activeProfileId]: nextFilters },
  }
}
