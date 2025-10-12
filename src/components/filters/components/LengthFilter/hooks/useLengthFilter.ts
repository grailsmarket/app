import { useAppSelector, useAppDispatch } from '@/app/state/hooks'
import usePosthogEvents from '@/app/hooks/usePosthogEvents'

import {
  selectMarketplaceFilters,
  setMarketplaceFiltersLength,
} from '@/app/state/reducers/filters/marketplaceFilters'

import { MARKETPLACE_LENGTH_VALUES } from '@/app/constants/filters/marketplaceFilters'

export const useLengthFilter = () => {
  const dispatch = useAppDispatch()
  const { capturePosthogEvent } = usePosthogEvents()
  const { length: lengthFilter } = useAppSelector(selectMarketplaceFilters)

  const minVal = lengthFilter.min
  const maxVal = lengthFilter.max

  const onChange = ({
    newMinIndex,
    newMaxIndex,
  }: {
    newMinIndex?: number
    newMaxIndex?: number
  }) => {
    const minOrMax = {
      min: typeof newMinIndex === 'number',
      max: typeof newMaxIndex === 'number',
    }

    const newValues = {
      min:
        newMinIndex !== undefined && minOrMax.min
          ? MARKETPLACE_LENGTH_VALUES[newMinIndex]
          : minVal,
      max:
        newMaxIndex !== undefined && minOrMax.max
          ? MARKETPLACE_LENGTH_VALUES[newMaxIndex]
          : maxVal,
    }

    dispatch(setMarketplaceFiltersLength(newValues))
    capturePosthogEvent('Set Length Filter', newValues)
  }

  return {
    minVal,
    maxVal,
    onChange,
  }
}
