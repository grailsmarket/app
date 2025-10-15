import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { PriceDenominationType } from '@/state/reducers/filters/marketplaceFilters'

export const usePriceRangeFilter = () => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const { denomination, priceRange } = selectors.filters

  const setDenominationGenerator = (value: PriceDenominationType) => {
    return () => {
      dispatch(actions.setPriceDenomination(value as any))
    }
  }

  const setMaxPrice = (value: string) => {
    dispatch(actions.setPriceRange({ ...priceRange, max: Number(value) }))
  }

  const setMinPrice = (value: string) => {
    dispatch(actions.setPriceRange({ ...priceRange, min: Number(value) }))
  }

  return {
    denomination,
    priceRange,
    setDenominationGenerator,
    setMaxPrice,
    setMinPrice,
  }
}
