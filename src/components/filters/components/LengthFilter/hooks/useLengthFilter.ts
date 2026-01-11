import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useEffect, useState, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

export const useLengthFilter = () => {
  const [currMinVal, setCurrMinVal] = useState<number | null>(null)
  const [currMaxVal, setCurrMaxVal] = useState<number | null>(null)
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const isInitialSync = useRef(true)

  const debouncedMinVal = useDebounce(currMinVal?.toString() || '', 400)
  const debouncedMaxVal = useDebounce(currMaxVal?.toString() || '', 400)

  const lengthFilter = selectors.filters.length

  const minVal = lengthFilter.min
  const maxVal = lengthFilter.max

  // Sync local state from Redux when Redux changes externally (e.g., from URL)
  useEffect(() => {
    // On initial sync or when Redux changes externally
    if (isInitialSync.current || (minVal !== currMinVal && minVal !== null)) {
      setCurrMinVal(minVal)
    }
    if (isInitialSync.current || (maxVal !== currMaxVal && maxVal !== null)) {
      setCurrMaxVal(maxVal)
    }

    if (isInitialSync.current) {
      isInitialSync.current = false
    }
    // Only re-run when Redux values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minVal, maxVal])

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
