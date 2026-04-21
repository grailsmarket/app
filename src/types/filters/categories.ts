import { CATEGORIES_PAGE_SORT_OPTIONS, CATEGORIES_PAGE_TYPE_OPTIONS } from '@/constants/filters/categories'
import { SortDirection } from '.'

export type CategoriesPageTypeOption = (typeof CATEGORIES_PAGE_TYPE_OPTIONS)[number]

export type CategoriesPageSortOption = (typeof CATEGORIES_PAGE_SORT_OPTIONS)[number]

export type CategoriesPageFiltersState = {
  search: string
  type: CategoriesPageTypeOption | null
  sort: CategoriesPageSortOption
  sortDirection: SortDirection
}

export type CategoriesPageFiltersOpenedState = CategoriesPageFiltersState & {
  open: boolean
  scrollTop: number
}
