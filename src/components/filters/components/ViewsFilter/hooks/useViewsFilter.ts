import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useEffect, useState, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

export const useViewsFilter = () => {
  const [currMinVal, setCurrMinVal] = useState<number | null>(null)
  const [currMaxVal, setCurrMaxVal] = useState<number | null>(null)
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const isInitialSync = useRef(true)

  const debouncedMinVal = useDebounce(currMinVal?.toString() || '', 400)
  const debouncedMaxVal = useDebounce(currMaxVal?.toString() || '', 400)

  // ViewsFilter is only rendered when viewCount exists in the state
  const viewCount = (selectors.filters as { viewCount?: { min: number | null; max: number | null } }).viewCount

  const minVal = viewCount?.min ?? null
  const maxVal = viewCount?.max ?? null

  // Sync local state from Redux when Redux changes externally (e.g., from URL or clear filters)
  useEffect(() => {
    // Sync on initial load, when Redux changes to a new non-null value, or when Redux is cleared to null
    if (
      isInitialSync.current ||
      (minVal !== currMinVal && minVal !== null) ||
      (minVal === null && currMinVal !== null)
    ) {
      setCurrMinVal(minVal)
    }
    if (
      isInitialSync.current ||
      (maxVal !== currMaxVal && maxVal !== null) ||
      (maxVal === null && currMaxVal !== null)
    ) {
      setCurrMaxVal(maxVal)
    }

    if (isInitialSync.current) {
      isInitialSync.current = false
    }
    // Only re-run when Redux values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minVal, maxVal])

  const setMinViews = (min: number) => {
    const newMin = min === 0 ? null : maxVal && min >= maxVal ? maxVal : min
    dispatch(actions.setViewCount({ min: newMin, max: viewCount?.max ?? null }))
  }

  const setMaxViews = (max: number) => {
    const newMax = max === 0 ? null : minVal && max <= minVal ? minVal : max
    dispatch(actions.setViewCount({ min: viewCount?.min ?? null, max: newMax }))
  }

  useEffect(() => {
    // Skip if debounce hasn't caught up with local state yet
    if ((currMinVal?.toString() ?? '') !== debouncedMinVal) return
    // Skip initial null state (waiting for URL sync, not user input)
    if (currMinVal === null && debouncedMinVal === '') return
    setMinViews(Number(debouncedMinVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMinVal, currMinVal])

  useEffect(() => {
    // Skip if debounce hasn't caught up with local state yet
    if ((currMaxVal?.toString() ?? '') !== debouncedMaxVal) return
    // Skip initial null state (waiting for URL sync, not user input)
    if (currMaxVal === null && debouncedMaxVal === '') return
    setMaxViews(Number(debouncedMaxVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMaxVal, currMaxVal])

  return {
    viewCount,
    minVal,
    maxVal,
    currMinVal,
    currMaxVal,
    setCurrMinVal,
    setCurrMaxVal,
    setMinViews,
    setMaxViews,
  }
}
