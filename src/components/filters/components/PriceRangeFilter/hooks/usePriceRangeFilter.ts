import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { PriceDenominationType } from '@/state/reducers/filters/marketplaceFilters'
import { useEffect, useState, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

export const usePriceRangeFilter = () => {
  const [currMinVal, setCurrMinVal] = useState<string | null>(null)
  const [currMaxVal, setCurrMaxVal] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const isInitialSync = useRef(true)

  const debouncedMinVal = useDebounce(currMinVal || '', 400)
  const debouncedMaxVal = useDebounce(currMaxVal || '', 400)

  const { denomination, priceRange } = selectors.filters

  const minVal = priceRange.min
  const maxVal = priceRange.max

  // Sync local state from Redux when Redux changes externally (e.g., from URL)
  useEffect(() => {
    // Only sync if Redux has a value and local state doesn't match
    const reduxMinStr = minVal !== null ? String(minVal) : null
    const reduxMaxStr = maxVal !== null ? String(maxVal) : null

    // On initial sync or when Redux changes externally
    if (isInitialSync.current || (reduxMinStr !== currMinVal && reduxMinStr !== null)) {
      setCurrMinVal(reduxMinStr)
    }
    if (isInitialSync.current || (reduxMaxStr !== currMaxVal && reduxMaxStr !== null)) {
      setCurrMaxVal(reduxMaxStr)
    }

    if (isInitialSync.current) {
      isInitialSync.current = false
    }
    // Only re-run when Redux values change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minVal, maxVal])

  const setDenominationGenerator = (value: PriceDenominationType) => {
    return () => {
      dispatch(actions.setPriceDenomination(value as any))
    }
  }

  const setMaxPrice = (value: number) => {
    const newMax = value === 0 ? null : minVal && value <= minVal ? minVal : value
    dispatch(actions.setPriceRange({ ...priceRange, max: newMax }))
  }

  const setMinPrice = (value: number) => {
    const newMin = value === 0 ? null : maxVal && value >= maxVal ? maxVal : value
    dispatch(actions.setPriceRange({ ...priceRange, min: newMin }))
  }

  useEffect(() => {
    setMinPrice(Number(debouncedMinVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMinVal])

  useEffect(() => {
    setMaxPrice(Number(debouncedMaxVal))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMaxVal])

  return {
    denomination,
    priceRange,
    setDenominationGenerator,
    setMaxPrice,
    setMinPrice,
    currMinVal,
    currMaxVal,
    setCurrMinVal,
    setCurrMaxVal,
  }
}
