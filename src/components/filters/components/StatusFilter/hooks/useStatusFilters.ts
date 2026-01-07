import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'
import { MarketplaceStatusFilterType } from '@/state/reducers/filters/marketplaceFilters'
import { ActivityTypeFilterType } from '@/state/reducers/filters/profileActivityFilters'
import { PortfolioStatusFilterType } from '@/types/filters'

export const useStatusFilters = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions, context } = useFilterRouter()
  const statusFilter = selectors.filters.status

  const isActive = (status: MarketplaceStatusFilterType | PortfolioStatusFilterType | ActivityTypeFilterType) => {
    if (!statusFilter) return false
    return statusFilter.includes(status as any)
  }

  const toggleActive = (status: MarketplaceStatusFilterType | PortfolioStatusFilterType | ActivityTypeFilterType) => {
    return () => {
      if (isActive(status)) {
        dispatch(actions.setFiltersStatus(null))
        return
      }

      if (status === 'Grace' || status === 'Premium') {
        dispatch(actions.setSort('expiry_date_asc'))
      }

      dispatch(actions.setFiltersStatus(status as any))
    }
  }

  const getStatus = (): string => {
    if (!statusFilter || statusFilter.filter((status) => !!status).length === 0) return 'none'
    return statusFilter[0]
  }

  const setStatus = (status: string) => {
    if (status === 'none') {
      dispatch(actions.setFiltersStatus(null))
      return
    }

    if (status === 'Grace' || status === 'Premium') {
      dispatch(actions.setSort('expiry_date_asc'))
    }

    dispatch(actions.setFiltersStatus(status as any))
  }

  return {
    isActive,
    toggleActive,
    getStatus,
    setStatus,
    statusFilter,
    context,
  }
}
