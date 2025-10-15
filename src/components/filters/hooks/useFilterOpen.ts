import { useState } from 'react'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { MarketplaceOpenableFilterType } from '@/state/reducers/filters/marketplaceFilters'

export const useFilterOpen = (filter?: MarketplaceOpenableFilterType) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()

  const openFilters = selectors.filters.openFilters

  const [open, setOpen] = useState(filter ? openFilters.includes(filter as any) : false)

  const toggleOpen = () => {
    setOpen((prev) => !prev)
    if (filter) {
      dispatch(actions.toggleFilterOpen(filter as any))
    }
  }

  return { open, toggleOpen }
}
