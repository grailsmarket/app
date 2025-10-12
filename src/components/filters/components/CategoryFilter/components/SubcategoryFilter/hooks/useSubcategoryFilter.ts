import { MouseEventHandler } from 'react'

import usePosthogEvents from '@/app/hooks/usePosthogEvents'
import { useAppDispatch, useAppSelector } from '@/app/state/hooks'

import {
  MarketplaceCategoryType,
  selectMarketplaceFilters,
  MarketplaceSubcategoryType,
  toggleMarketplaceSubcategory,
} from '@/app/state/reducers/filters/marketplaceFilters'

export const useSubcategoryFilter = (
  subcategory: MarketplaceSubcategoryType,
  category: MarketplaceCategoryType,
) => {
  const dispatch = useAppDispatch()
  const { capturePosthogEvent } = usePosthogEvents()
  const { categoryObjects } = useAppSelector(selectMarketplaceFilters)

  const relevantCategoryObjects = categoryObjects.filter(
    ({ category: _category }) => _category === category,
  )

  const isSubcategoryActive = relevantCategoryObjects.some(
    ({ subcategory: _subcategory }) => _subcategory === subcategory,
  )

  const toggleSubcategory: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()

    dispatch(toggleMarketplaceSubcategory({ subcategory, category }))

    const posthogEvent = `${
      isSubcategoryActive ? 'Removed' : 'Applied'
    } Subcategory "${subcategory}"`
    capturePosthogEvent(posthogEvent)
  }

  return {
    isSubcategoryActive,
    toggleSubcategory,
  }
}
