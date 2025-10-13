import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectMarketplaceFilters,
  toggleMarketplaceFilterOpen,
  MarketplaceOpenableFilterType,
} from '@/state/reducers/filters/marketplaceFilters'

export const useFilterOpen = (filter?: MarketplaceOpenableFilterType) => {
  const dispatch = useAppDispatch()
  const { openFilters } = useAppSelector(selectMarketplaceFilters)

  const [open, setOpen] = useState(filter ? openFilters.includes(filter) : false)

  const toggleOpen = () => {
    setOpen((prev) => !prev)
    if (filter) {
      dispatch(toggleMarketplaceFilterOpen(filter))
    }
  }

  return { open, toggleOpen }
}
