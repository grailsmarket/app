import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { PriceDenominationType } from '@/state/reducers/filters/marketplaceFilters'

export const usePriceRangeFilter = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

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

  return {
    denomination,
    priceRange,
    setDenominationGenerator,
    setMaxPrice,
    setMinPrice,
  }
}
