import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

export const useFilterButtons = () => {
  const dispatch = useAppDispatch()
  const { actions, isFiltersClear } = useFilterRouter()

  const clearFilters = () => {
    dispatch(actions.clearFilters())
  }

  const closeFilters = () => {
    dispatch(actions.setFiltersOpen(false))
  }

  return {
    clearFilters,
    isFiltersClear,
    closeFilters,
  }
}
