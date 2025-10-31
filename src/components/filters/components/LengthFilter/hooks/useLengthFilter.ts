import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

export const useLengthFilter = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const lengthFilter = selectors.filters.length

  const minVal = lengthFilter.min
  const maxVal = lengthFilter.max

  const setMinLength = (min: number) => {
    const newMin = min === 0 ? null : maxVal && min >= maxVal ? maxVal : min
    dispatch(actions.setFiltersLength({ min: newMin, max: lengthFilter.max }))
  }

  const setMaxLength = (max: number) => {
    const newMax = max === 0 ? null : minVal && max <= minVal ? minVal : max
    dispatch(actions.setFiltersLength({ min: lengthFilter.min, max: newMax }))
  }

  return {
    minVal,
    maxVal,
    setMinLength,
    setMaxLength,
  }
}
