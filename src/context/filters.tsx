'use client'

import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { FilterContextType } from '@/types/filters'
import { ProfileTabType } from '@/state/reducers/portfolio/profile'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { usePathname, useSearchParams } from 'next/navigation'
import { beautifyName } from '@/lib/ens'

interface FilterContextValue {
  filterType: FilterContextType
  profileTab?: ProfileTabType
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined)

interface FilterProviderProps {
  children: ReactNode
  filterType: FilterContextType
  profileTab?: ProfileTabType
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children, filterType, profileTab }) => {
  const dispatch = useAppDispatch()
  const { actions } = useFilterRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (actions) {
      if (!pathname.includes('/marketplace')) dispatch(actions.clearFilters())

      const defaultSearch = searchParams.get('search')
      if (defaultSearch) {
        const isBulkSearching = defaultSearch.replaceAll(' ', ',').split(',').length > 1
        const searchToApply = isBulkSearching
          ? defaultSearch
              .replaceAll(' ', ',')
              .split(',')
              .map((query) => beautifyName(query.trim()))
              .join(', ')
          : beautifyName(defaultSearch)
        dispatch(actions.setSearch(searchToApply))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return <FilterContext.Provider value={{ filterType, profileTab }}>{children}</FilterContext.Provider>
}

export const useFilterContext = (): FilterContextValue => {
  const context = useContext(FilterContext)
  if (!context) {
    // Default to marketplace if no context is provided (backwards compatibility)
    return { filterType: 'marketplace' }
  }
  return context
}
