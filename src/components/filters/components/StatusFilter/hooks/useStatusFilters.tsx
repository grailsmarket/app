import { MouseEventHandler } from 'react'

import { useAppSelector, useAppDispatch } from '@/state/hooks'

import {
  MarketplaceStatusFilterType,
  selectMarketplaceFilters,
  toggleMarketplaceFiltersStatus,
} from '@/state/reducers/filters/marketplaceFilters'

export const useStatusFilters = () => {
  const dispatch = useAppDispatch()
  const { status: statusFilter } = useAppSelector(selectMarketplaceFilters)

  const isActive = (status: MarketplaceStatusFilterType) => {
    if (!statusFilter) return false
    return statusFilter.includes(status)
  }

  const toggleActive = (status: MarketplaceStatusFilterType) => {
    return () => {
      dispatch(toggleMarketplaceFiltersStatus(status))
    }
  }

  return {
    isActive,
    toggleActive,
    statusFilter,
  }
}
