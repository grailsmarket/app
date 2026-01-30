import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useEffect, useState, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

export const useWatchersFilter = () => {
  const [currMinVal, setCurrMinVal] = useState<number | null>(null)
  const [currMaxVal, setCurrMaxVal] = useState<number | null>(null)
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const isInitialSync = useRef(true)

  const debouncedMinVal = useDebounce(currMinVal?.toString() || '', 400)
  const debouncedMaxVal = useDebounce(currMaxVal?.toString() || '', 400)

  // WatchersFilter is only rendered when watchersCount exists in the state
  const watchersCount = (selectors.filters as { watchersCount?: { min: number | null; max: number | null } })
    .watchersCount

  const minVal = watchersCount?.min ?? null
  const maxVal = watchersCount?.max ?? null

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

  const setMinWatchers = (min: number) => {
    const newMin = min === 0 ? null : maxVal && min >= maxVal ? maxVal : min
    dispatch(actions.setWatchersCount({ min: newMin, max: watchersCount?.max ?? null }))
  }

  const setMaxWatchers = (max: number) => {
    const newMax = max === 0 ? null : minVal && max <= minVal ? minVal : max
    dispatch(actions.setWatchersCount({ min: watchersCount?.min ?? null, max: newMax }))
  }

  useEffect(() => {
    // Skip if debounce hasn't caught up with local state yet
    if ((currMinVal?.toString() ?? '') !== debouncedMinVal) return
    // Skip initial null state (waiting for URL sync, not user input)
    if (currMinVal === null && debouncedMinVal === '') return
    setMinWatchers(Number(debouncedMinVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMinVal, currMinVal])

  useEffect(() => {
    // Skip if debounce hasn't caught up with local state yet
    if ((currMaxVal?.toString() ?? '') !== debouncedMaxVal) return
    // Skip initial null state (waiting for URL sync, not user input)
    if (currMaxVal === null && debouncedMaxVal === '') return
    setMaxWatchers(Number(debouncedMaxVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMaxVal, currMaxVal])

  return {
    watchersCount,
    minVal,
    maxVal,
    currMinVal,
    currMaxVal,
    setCurrMinVal,
    setCurrMaxVal,
    setMinWatchers,
    setMaxWatchers,
  }
}
