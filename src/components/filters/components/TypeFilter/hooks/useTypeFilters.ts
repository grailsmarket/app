import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import {
  MarketplaceTypeFilterLabel,
  TypeFilterOption,
  EMPTY_TYPE_FILTERS_STATE,
} from '@/constants/filters/marketplaceFilters'
import { TypeFiltersState } from '@/types/filters'

export const useTypeFilters = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const typeFilters = selectors.filters.type as TypeFiltersState

  const getOption = (type: MarketplaceTypeFilterLabel): TypeFilterOption => {
    return typeFilters[type] || 'none'
  }

  const setOption = (type: MarketplaceTypeFilterLabel, option: TypeFilterOption) => {
    if (option === 'only') {
      // When 'only' is selected, set all other types to 'none'
      const newState: TypeFiltersState = { ...EMPTY_TYPE_FILTERS_STATE, [type]: 'only' }
      dispatch(actions.setFiltersType(newState as any))
    } else if (option === 'include' || option === 'exclude') {
      // If setting to include/exclude, check if any other filter is 'only' and change it to 'include'
      const newState: TypeFiltersState = { ...typeFilters, [type]: option }
      // Convert any 'only' to 'include' since we're now including multiple filters
      for (const key of Object.keys(newState) as MarketplaceTypeFilterLabel[]) {
        if (newState[key] === 'only') {
          newState[key] = 'include'
        }
      }
      dispatch(actions.setFiltersType(newState as any))
    } else {
      // Setting to 'none'
      const newState: TypeFiltersState = { ...typeFilters, [type]: option }
      dispatch(actions.setFiltersType(newState as any))
    }
  }

  // Legacy toggle function for backwards compatibility
  const toggleActiveGenerator = (type: MarketplaceTypeFilterLabel) => {
    const currentOption = getOption(type)
    setOption(type, currentOption === 'none' ? 'include' : 'none')
  }

  // Legacy isActive function for backwards compatibility
  const isActive = (type: MarketplaceTypeFilterLabel) => {
    return getOption(type) !== 'none'
  }

  return {
    typeFilters,
    getOption,
    setOption,
    // Legacy exports
    isActive,
    toggleActiveGenerator,
  }
}
