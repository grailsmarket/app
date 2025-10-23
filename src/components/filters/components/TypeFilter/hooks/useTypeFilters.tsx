import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { MarketplaceTypeFilterType } from '@/state/reducers/filters/marketplaceFilters'

export const useTypeFilters = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const typeFilters = selectors.filters.type

  const isActive = (type: MarketplaceTypeFilterType) => {
    // @ts-expect-error type doesn't come through from the filter router
    return typeFilters.includes(type)
  }

  const toggleActiveGenerator = (type: MarketplaceTypeFilterType) => {
    dispatch(actions.toggleFiltersType(type as any))
  }

  return {
    isActive,
    toggleActiveGenerator,
  }
}
