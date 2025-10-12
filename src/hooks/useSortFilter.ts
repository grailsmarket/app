import { useAppDispatch, useAppSelector } from '../state/hooks'
import {
  SortFilterType,
  setMarketplaceSort,
  selectMarketplaceFilters,
} from '../state/reducers/filters/marketplaceFilters'

const useSortFilter = () => {
  const dispatch = useAppDispatch()
  const { sort } = useAppSelector(selectMarketplaceFilters)

  const setSortFilter = (option: SortFilterType | null) => {
    dispatch(setMarketplaceSort(option))
  }

  return {
    sort,
    setSortFilter,
  }
}

export default useSortFilter
