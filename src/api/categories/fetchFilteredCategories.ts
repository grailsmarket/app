import { API_URL } from '@/constants/api'
import { APIResponseType } from '@/types/api'
import { CategoryType } from '@/types/domains'
import { buildQueryParamString } from '@/utils/api/buildQueryParamString'
import {
  CategoriesPageTypeOption,
  CategoriesPageSortOption,
  CategoriesPageSortDirection,
} from '@/constants/filters/categoriesPageFilters'

interface FetchFilteredCategoriesOptions {
  type?: CategoriesPageTypeOption | null
  sort?: CategoriesPageSortOption
  sortDirection?: CategoriesPageSortDirection
}

export const fetchFilteredCategories = async ({ type, sort, sortDirection }: FetchFilteredCategoriesOptions = {}) => {
  const paramString = buildQueryParamString({
    'class[]': type || undefined,
    sortBy: sort || undefined,
    sortOrder: sortDirection || undefined,
  })

  const url = paramString ? `${API_URL}/clubs?${paramString}` : `${API_URL}/clubs`

  const res = await fetch(url)
  const data = (await res.json()) as APIResponseType<{
    clubs: CategoryType[]
  }>

  return data.data.clubs
}
