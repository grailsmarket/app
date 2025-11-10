import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

export const useLengthFilter = () => {
  const [currMinVal, setCurrMinVal] = useState<number | null>(null)
  const [currMaxVal, setCurrMaxVal] = useState<number | null>(null)
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const debouncedMinVal = useDebounce(currMinVal?.toString() || '', 400)
  const debouncedMaxVal = useDebounce(currMaxVal?.toString() || '', 400)

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

  useEffect(() => {
    setMinLength(Number(debouncedMinVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMinVal])

  useEffect(() => {
    setMaxLength(Number(debouncedMaxVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMaxVal])

  return {
    minVal,
    maxVal,
    currMinVal,
    currMaxVal,
    setCurrMinVal,
    setCurrMaxVal,
    setMinLength,
    setMaxLength,
  }
}
