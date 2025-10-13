import _ from 'lodash'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { setMarketplaceSearchFloor, setMarketplaceSearchSimilar } from '@/state/reducers/search/marketplaceSearch'
import { clearMarketplaceFilters, selectMarketplaceFilters } from '@/state/reducers/filters/marketplaceFilters'
import { initialState as marketplaceFiltersInitialState } from '@/state/reducers/filters/marketplaceFilters'

export const useFilterButtons = () => {
  const dispatch = useAppDispatch()
  const marketplaceFilters = useAppSelector(selectMarketplaceFilters)

  const isFiltersClear = _.isEqual(marketplaceFilters, marketplaceFiltersInitialState)

  const clearFilters = () => {
    dispatch(setMarketplaceSearchFloor(false))
    dispatch(setMarketplaceSearchSimilar(false))
    dispatch(clearMarketplaceFilters())
  }

  return {
    isFiltersClear,
    clearFilters,
  }
}
