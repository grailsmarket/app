import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useEffect, useState, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

export const useOfferFilter = () => {
  const [currMinVal, setCurrMinVal] = useState<string | null>(null)
  const [currMaxVal, setCurrMaxVal] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const isInitialSync = useRef(true)

  const debouncedMinVal = useDebounce(currMinVal || '', 400)
  const debouncedMaxVal = useDebounce(currMaxVal || '', 400)

  // OfferFilter is only rendered when offerRange exists in the state (Names/Domains/Grace/Watchlist/Listings tabs)
  const offerRange = (selectors.filters as { offerRange?: { min: number | null; max: number | null } }).offerRange

  const minVal = offerRange?.min ?? null
  const maxVal = offerRange?.max ?? null

  // Sync local state from Redux when Redux changes externally (e.g., from URL or clear filters)
  useEffect(() => {
    const reduxMinStr = minVal !== null ? String(minVal) : null
    const reduxMaxStr = maxVal !== null ? String(maxVal) : null

    // Sync on initial load, when Redux changes to a new non-null value, or when Redux is cleared to null
    if (
      isInitialSync.current ||
      (reduxMinStr !== currMinVal && reduxMinStr !== null) ||
      (reduxMinStr === null && currMinVal !== null)
    ) {
      setCurrMinVal(reduxMinStr)
    }
    if (
      isInitialSync.current ||
      (reduxMaxStr !== currMaxVal && reduxMaxStr !== null) ||
      (reduxMaxStr === null && currMaxVal !== null)
    ) {
      setCurrMaxVal(reduxMaxStr)
    }

    if (isInitialSync.current) {
      isInitialSync.current = false
    }
    // Only re-run when Redux values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minVal, maxVal])

  const setMaxOffer = (value: number) => {
    const newMax = value === 0 ? null : minVal && value <= minVal ? minVal : value
    dispatch(actions.setOfferRange({ min: offerRange?.min ?? null, max: newMax }))
  }

  const setMinOffer = (value: number) => {
    const newMin = value === 0 ? null : maxVal && value >= maxVal ? maxVal : value
    dispatch(actions.setOfferRange({ min: newMin, max: offerRange?.max ?? null }))
  }

  useEffect(() => {
    // Skip if debounce hasn't caught up with local state yet (e.g., initial render after URL sync)
    if ((currMinVal ?? '') !== debouncedMinVal) return
    setMinOffer(Number(debouncedMinVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMinVal, currMinVal])

  useEffect(() => {
    // Skip if debounce hasn't caught up with local state yet (e.g., initial render after URL sync)
    if ((currMaxVal ?? '') !== debouncedMaxVal) return
    setMaxOffer(Number(debouncedMaxVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMaxVal, currMaxVal])

  return {
    offerRange,
    setMaxOffer,
    setMinOffer,
    currMinVal,
    currMaxVal,
    setCurrMinVal,
    setCurrMaxVal,
  }
}
