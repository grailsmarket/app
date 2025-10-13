import { MouseEventHandler } from 'react'
import { useAppSelector, useAppDispatch } from '@/state/hooks'
import {
  selectMarketplaceFilters,
  MarketplaceTypeFilterType,
  toggleMarketplaceFiltersType,
} from '@/state/reducers/filters/marketplaceFilters'

export const useTypeFilters = () => {
  const dispatch = useAppDispatch()
  const { type: typeFilters } = useAppSelector(selectMarketplaceFilters)

  const isActive = (type: MarketplaceTypeFilterType) => {
    return typeFilters.includes(type)
  }

  const toggleActiveGenerator = (
    type: MarketplaceTypeFilterType,
  ): MouseEventHandler<HTMLButtonElement> => {
    return () => {
      dispatch(toggleMarketplaceFiltersType(type))
    }
  }

  return {
    isActive,
    toggleActiveGenerator,
  }
}
