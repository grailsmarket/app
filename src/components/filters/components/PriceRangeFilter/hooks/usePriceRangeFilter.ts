import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  PriceDenominationType,
  selectMarketplaceFilters,
  setMarketplacePriceDenomination,
  setMarketplacePriceRange,
} from '@/state/reducers/filters/marketplaceFilters'

export const usePriceRangeFilter = () => {
  const dispatch = useAppDispatch()
  const { denomination, priceRange } = useAppSelector(selectMarketplaceFilters)

  const setDenominationGenerator = (value: PriceDenominationType) => {
    return () => {
      dispatch(setMarketplacePriceDenomination(value))
    }
  }

  const setMaxPrice = (value: string) => {
    dispatch(setMarketplacePriceRange({ ...priceRange, max: Number(value) }))
  }

  const setMinPrice = (value: string) => {
    dispatch(setMarketplacePriceRange({ ...priceRange, min: Number(value) }))
  }

  return {
    denomination,
    priceRange,
    setDenominationGenerator,
    setMaxPrice,
    setMinPrice,
  }
}
