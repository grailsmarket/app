import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useAppDispatch } from '@/state/hooks'
import { SortFilterType } from '@/types/filters'

export const useSortFilters = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions, context } = useFilterRouter()

  const sortFilter = selectors.filters.sort

  const isActive = (sortType: SortFilterType) => {
    if (!sortFilter) return false
    return sortFilter === sortType
  }

  const toggleActive = (sortType: SortFilterType) => {
    return () => {
      if (sortFilter === sortType) {
        dispatch(actions.setSort(null))
        return
      }

      dispatch(actions.setSort(sortType))
    }
  }

  return {
    isActive,
    toggleActive,
    sortFilter,
    context,
  }
}
