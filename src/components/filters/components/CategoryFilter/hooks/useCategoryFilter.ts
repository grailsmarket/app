import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { MarketplaceCategoryType, MarketplaceSubcategoryType } from '@/state/reducers/filters/marketplaceFilters'
import { MARKETPLACE_CATEGORY_OBJECTS } from '@/constants/filters/marketplaceFilters'
import { PortfolioCategoryType } from '@/types/filters'

export const useCategoryFilter = (category: MarketplaceCategoryType) => {
  const dispatch = useAppDispatch()
  const { selectors, actions, context } = useFilterRouter()

  const { categoryObjects } = selectors.filters

  if (context === 'marketplace') {
    const relevantSubcategories: MarketplaceSubcategoryType[] = MARKETPLACE_CATEGORY_OBJECTS.filter(
      ({ category: _category }) => _category === category
    ).map(({ subcategory }) => subcategory)

    const subcategoryFilterHeight = relevantSubcategories.length * 38 + 32 + 'px'

    const isCategoryActive = (categoryObjects as any[]).some(({ category: _category }) => _category === category)

    const toggleCategory = () => {
      dispatch(actions.toggleCategory(category as any))
    }

    return {
      relevantSubcategories,
      subcategoryFilterHeight,
      isCategoryActive,
      toggleCategory,
    }
  } else {
    // For myDomains, we have simpler category structure
    const isCategoryActive = (categoryObjects as PortfolioCategoryType[]).includes(category as PortfolioCategoryType)

    const toggleCategory = () => {
      dispatch(actions.toggleCategory(category as any))
    }

    return {
      relevantSubcategories: [],
      subcategoryFilterHeight: '0px',
      isCategoryActive,
      toggleCategory,
    }
  }
}
