import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { MarketplaceTypeFilterType } from '@/state/reducers/filters/marketplaceFilters'

export const useTypeFilters = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const typeFilters = selectors.filters.type

  const isActive = (type: MarketplaceTypeFilterType) => {
    return typeFilters.includes(type as any)
  }

  const toggleActiveGenerator = (type: MarketplaceTypeFilterType) => {
    dispatch(actions.toggleFiltersType(type as any))
  }

  return {
    isActive,
    toggleActiveGenerator,
  }
}
