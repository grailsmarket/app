import { useState } from 'react'

import { useAppDispatch, useAppSelector } from '@/app/state/hooks'

import {
  selectMarketplaceFilters,
  toggleMarketplaceFilterOpen,
  MarketplaceOpenableFilterType,
} from '@/app/state/reducers/filters/marketplaceFilters'

export const useFilterOpen = (filter?: MarketplaceOpenableFilterType) => {
  const dispatch = useAppDispatch()
  const { openFilters } = useAppSelector(selectMarketplaceFilters)

  const [open, setOpen] = useState(
    filter ? openFilters.includes(filter) : false,
  )

  const toggleOpen = () => {
    setOpen((prev) => !prev)
    if (filter) {
      dispatch(toggleMarketplaceFilterOpen(filter))
    }
  }

  return { open, toggleOpen }
}
