import { ChangeEventHandler } from 'react'

import usePosthogEvents from '@/app/hooks/usePosthogEvents'
import { useAppDispatch, useAppSelector } from '@/app/state/hooks'

import {
  PriceDenominationType,
  selectMarketplaceFilters,
  setMarketplacePriceDenomination,
  setMarketplacePriceRange,
} from '@/app/state/reducers/filters/marketplaceFilters'

export enum MinOrMax {
  min,
  max,
}

export const usePriceRangeFilter = () => {
  const dispatch = useAppDispatch()
  const { denomination, priceRange } = useAppSelector(selectMarketplaceFilters)
  const { capturePosthogEvent } = usePosthogEvents()

  const setDenominationGenerator = (value: PriceDenominationType) => {
    return () => {
      dispatch(setMarketplacePriceDenomination(value))

      const posthogEvent = `Set Price Filter Currency to "${value}"`
      capturePosthogEvent(posthogEvent)
    }
  }

  const onChangeGenerator = (
    minOrMax: MinOrMax,
  ): ChangeEventHandler<HTMLInputElement> => {
    return (e) => {
      if (minOrMax === MinOrMax.min) {
        dispatch(
          setMarketplacePriceRange({
            min: e.target.value,
            max: priceRange.max,
          }),
        )
      } else {
        dispatch(
          setMarketplacePriceRange({
            min: priceRange.min,
            max: e.target.value,
          }),
        )
      }

      const posthogEvent = `Set price ${
        minOrMax === MinOrMax.min ? 'MIN' : 'MAX'
      } to "${e.target.value} ${denomination}"`
      capturePosthogEvent(posthogEvent)
    }
  }

  return {
    denomination,
    priceRange,
    setDenominationGenerator,
    onChangeGenerator,
  }
}
