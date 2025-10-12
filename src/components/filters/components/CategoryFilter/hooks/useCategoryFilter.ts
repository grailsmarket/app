import { MouseEventHandler } from 'react'

import usePosthogEvents from '@/app/hooks/usePosthogEvents'
import { useAppDispatch, useAppSelector } from '@/app/state/hooks'

import {
  MarketplaceCategoryType,
  selectMarketplaceFilters,
  MarketplaceSubcategoryType,
} from '@/app/state/reducers/filters/marketplaceFilters'
import { toggleMarketplaceCategory } from '@/app/state/reducers/filters/marketplaceFilters'

import { MARKETPLACE_CATEGORY_OBJECTS } from '@/app/constants/filters/marketplaceFilters'

export const useCategoryFilter = (category: MarketplaceCategoryType) => {
  const dispatch = useAppDispatch()
  const { capturePosthogEvent } = usePosthogEvents()
  const { categoryObjects } = useAppSelector(selectMarketplaceFilters)

  const relevantSubcategories: MarketplaceSubcategoryType[] =
    MARKETPLACE_CATEGORY_OBJECTS.filter(
      ({ category: _category }) => _category === category,
    ).map(({ subcategory }) => subcategory)

  const subcategoryFilterHeight = relevantSubcategories.length * 38 + 32 + 'px'

  const isCategoryActive = categoryObjects.some(
    ({ category: _category }) => _category === category,
  )

  const toggleCategory: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    dispatch(toggleMarketplaceCategory(category))

    const posthogEvent = `${
      isCategoryActive ? 'Removed' : 'Applied'
    } Category "${category}"`
    capturePosthogEvent(posthogEvent)
  }

  return {
    relevantSubcategories,
    subcategoryFilterHeight,
    isCategoryActive,
    toggleCategory,
  }
}
