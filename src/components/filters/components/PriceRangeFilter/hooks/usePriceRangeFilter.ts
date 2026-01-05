import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { PriceDenominationType } from '@/state/reducers/filters/marketplaceFilters'
import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

export const usePriceRangeFilter = () => {
  const [currMinVal, setCurrMinVal] = useState<string | null>(null)
  const [currMaxVal, setCurrMaxVal] = useState<string | null>(null)
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const debouncedMinVal = useDebounce(currMinVal || '', 400)
  const debouncedMaxVal = useDebounce(currMaxVal || '', 400)

  const { denomination, priceRange } = selectors.filters

  const minVal = priceRange.min
  const maxVal = priceRange.max

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
