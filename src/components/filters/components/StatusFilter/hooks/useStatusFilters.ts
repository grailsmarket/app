import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { MarketplaceStatusFilterType } from '@/state/reducers/filters/marketplaceFilters'
import { PortfolioStatusFilterType } from '@/types/filters'

export const useStatusFilters = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions, context } = useFilterRouter()

  const statusFilter = selectors.filters.status

  const isActive = (status: MarketplaceStatusFilterType | PortfolioStatusFilterType) => {
    if (!statusFilter) return false
    return statusFilter.includes(status as any)
  }

  const toggleActive = (status: MarketplaceStatusFilterType | PortfolioStatusFilterType) => {
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
