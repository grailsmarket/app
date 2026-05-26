import { NameFilters, SortFilterType } from '@/types/filters/name'

export type SavedSearchConfig = {
  q?: string
  filters?: Partial<NameFilters>
  sortBy?: SortFilterType | null
  sortOrder?: 'asc' | 'desc' | null
}

export type SavedSearch = SavedSearchConfig & {
  id: number
  name: string
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export type CreateSavedSearchInput = SavedSearchConfig & {
  name: string
  isDefault?: boolean
}

export type UpdateSavedSearchInput = Partial<CreateSavedSearchInput>

export type SavedSearchErrorCode =
  | 'DUPLICATE_SEARCH_NAME'
  | 'LIMIT_EXCEEDED'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'INSUFFICIENT_TIER'
