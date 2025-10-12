import { ChangeEventHandler } from 'react'

import usePosthogEvents from '@/app/hooks/usePosthogEvents'
import { useAppSelector, useAppDispatch } from '@/app/state/hooks'

import {
  selectMarketplaceFilters,
  MarketplaceTypeFilterType,
  toggleMarketplaceFiltersType,
} from '@/app/state/reducers/filters/marketplaceFilters'

export const useTypeFilters = () => {
  const dispatch = useAppDispatch()
  const { capturePosthogEvent } = usePosthogEvents()
  const { type: typeFilters } = useAppSelector(selectMarketplaceFilters)

  const isActive = (type: MarketplaceTypeFilterType) => {
    return typeFilters.includes(type)
  }

  const toggleActiveGenerator = (
    type: MarketplaceTypeFilterType,
  ): ChangeEventHandler<HTMLInputElement> => {
    return () => {
      dispatch(toggleMarketplaceFiltersType(type))

      const posthogEvent = `${
        isActive(type) ? 'Removed' : 'Applied'
      } "${type}" Status`
      capturePosthogEvent(posthogEvent)
    }
  }

  return {
    isActive,
    toggleActiveGenerator,
  }
}
