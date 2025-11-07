import { useAppDispatch } from '../state/hooks'
import { SortFilterType } from '../types/filters'
import { useFilterRouter } from './filters/useFilterRouter'

const useSortFilter = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const sort = selectors.filters.sort

  const setSortFilter = (option: SortFilterType | null) => {
    dispatch(actions.setSort(option))
  }

  return {
    sort,
    setSortFilter,
  }
}

export default useSortFilter
