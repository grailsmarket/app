import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'

export const useCategoryFilter = (category: string) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const selectedCategories = selectors.filters.categories
  // For myDomains, we have simpler category structure
  const isCategoryActive = selectedCategories?.includes(category)

  const toggleCategory = () => {
    dispatch(actions.toggleCategory(category))
  }

  return {
    isCategoryActive,
    toggleCategory,
  }
}
