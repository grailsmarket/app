import { ActivityTypeFilterType } from '@/state/reducers/filters/profileActivityFilters'
import { useFilterOpen } from '../../hooks/useFilterOpen'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

export const useType = () => {
  const { open, toggleOpen } = useFilterOpen('Type')
  const { selectors, actions } = useFilterRouter()
  const dispatch = useAppDispatch()
  const typeFilter = selectors.filters.type

  const isActive = (type: ActivityTypeFilterType) => {
    // @ts-expect-error - type doesn't come through from the filter router
    return typeFilter.includes(type)
  }

  const toggleActiveGenerator = (type: ActivityTypeFilterType) => {
    dispatch(actions.toggleFiltersType(type))
  }

  return {
    open,
    toggleOpen,
    isActive,
    toggleActiveGenerator,
  }
}
