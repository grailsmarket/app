import _ from 'lodash'

import usePosthogEvents from '@/app/hooks/usePosthogEvents'
import { useAppDispatch, useAppSelector } from '@/app/state/hooks'

import {
  setMarketplaceSearchFloor,
  setMarketplaceSearchSimilar,
} from '@/app/state/reducers/search/marketplaceSearch'
import {
  clearMarketplaceFilters,
  selectMarketplaceFilters,
} from '@/app/state/reducers/filters/marketplaceFilters'
import { initialState as marketplaceFiltersInitialState } from '@/app/state/reducers/filters/marketplaceFilters'

export const useFilterButtons = () => {
  const dispatch = useAppDispatch()
  const marketplaceFilters = useAppSelector(selectMarketplaceFilters)
  const { capturePosthogEvent } = usePosthogEvents()

  const isFiltersClear = _.isEqual(
    marketplaceFilters,
    marketplaceFiltersInitialState,
  )

  const clearFilters = () => {
    dispatch(setMarketplaceSearchFloor(false))
    dispatch(setMarketplaceSearchSimilar(false))
    dispatch(clearMarketplaceFilters())
    capturePosthogEvent('Cleared Filters')
  }

  return {
    isFiltersClear,
    clearFilters,
  }
}
