import { selectMarketplaceFilters, setMarketplaceFiltersLength } from '@/state/reducers/filters/marketplaceFilters'
import { useAppSelector, useAppDispatch } from '@/state/hooks'

export const useLengthFilter = () => {
  const dispatch = useAppDispatch()
  const { length: lengthFilter } = useAppSelector(selectMarketplaceFilters)

  const minVal = lengthFilter.min
  const maxVal = lengthFilter.max

  const setMinLength = (min: number) => {
    const newMin = maxVal && min >= maxVal ? maxVal : min
    dispatch(setMarketplaceFiltersLength({ min: newMin, max: lengthFilter.max }))
  }
  const setMaxLength = (max: number) => {
    const newMax = minVal && max <= minVal ? minVal : max
    dispatch(setMarketplaceFiltersLength({ min: lengthFilter.min, max: newMax }))
  }

  return {
    minVal,
    maxVal,
    setMinLength,
    setMaxLength,
  }
}
