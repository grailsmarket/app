import _ from 'lodash'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

export const useFilterButtons = () => {
  const dispatch = useAppDispatch()
  const { actions, isFiltersClear } = useFilterRouter()
  const clearFilters = () => {
    dispatch(actions.clearFilters())
  }

  return {
    clearFilters,
    isFiltersClear,
  }
}
