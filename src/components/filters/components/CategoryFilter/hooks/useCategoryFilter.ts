import { MouseEventHandler } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  MarketplaceCategoryType,
  selectMarketplaceFilters,
  MarketplaceSubcategoryType,
} from '@/state/reducers/filters/marketplaceFilters'
import { toggleMarketplaceCategory } from '@/state/reducers/filters/marketplaceFilters'
import { MARKETPLACE_CATEGORY_OBJECTS } from '@/constants/filters/marketplaceFilters'

export const useCategoryFilter = (category: MarketplaceCategoryType) => {
  const dispatch = useAppDispatch()
  const { categoryObjects } = useAppSelector(selectMarketplaceFilters)

  const relevantSubcategories: MarketplaceSubcategoryType[] = MARKETPLACE_CATEGORY_OBJECTS.filter(
    ({ category: _category }) => _category === category
  ).map(({ subcategory }) => subcategory)

  const subcategoryFilterHeight = relevantSubcategories.length * 38 + 32 + 'px'

  const isCategoryActive = categoryObjects.some(({ category: _category }) => _category === category)

  const toggleCategory: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    dispatch(toggleMarketplaceCategory(category))
  }

  return {
    relevantSubcategories,
    subcategoryFilterHeight,
    isCategoryActive,
    toggleCategory,
  }
}
