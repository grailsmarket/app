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
      dispatch(actions.toggleFiltersStatus(status as any))
    }
  }

  return {
    isActive,
    toggleActive,
    statusFilter,
    context,
  }
}
