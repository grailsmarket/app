import { combineReducers, createAction, createNextState, createReducer, type UnknownAction } from '@reduxjs/toolkit'
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

export const setBrokerScrollTop = createAction<number>('profileBroker/setScrollTop')

const profileFiltersReducer = combineReducers({
  domains: profileDomainsFilters,
  listings: profileListingsFilters,
  grace: profileGraceFilters,
  expired: profileExpiredFilters,
  activity: profileActivityFilters,
  watchlist: watchlistFilters,
  sent_offers: myOffersFilters,
  received_offers: receivedOffersFilters,
  broker: createReducer({ scrollTop: 0 }, (builder) =>
    builder.addCase(setBrokerScrollTop, (state, { payload }) => {
      state.scrollTop = payload
    })
  ),
})

export type ProfileFilters = ReturnType<typeof profileFiltersReducer>

interface ProfileFiltersState {
  activeProfileId: Address | null
  byProfile: Partial<Record<Address, ProfileFilters>>
}

const initialState: ProfileFiltersState = { activeProfileId: null, byProfile: {} }

const defaults = profileFiltersReducer(undefined, { type: '@@INIT' })

export const openProfileFilters = createAction<{
  address: Address
  resetTab?: ProfileTabType['value']
  restoreScroll: boolean
}>('profileFilters/open')

export default function reducer(state = initialState, action: UnknownAction): ProfileFiltersState {
  if (openProfileFilters.match(action)) {
    const { address, resetTab, restoreScroll } = action.payload
    const id = address.toLowerCase() as Address
    const previous = state.byProfile[id] ?? defaults
    const filters = createNextState(previous, (draft) => {
      if (resetTab && resetTab !== 'broker') {
        Object.assign(draft, { [resetTab]: { ...defaults[resetTab], scrollTop: draft[resetTab].scrollTop } })
      }

      if (!restoreScroll) {
        for (const tab of Object.values(draft)) tab.scrollTop = 0
      }
    })

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
