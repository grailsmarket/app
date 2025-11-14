'use client'

import React, { createContext, useContext, ReactNode, useEffect } from 'react'
import { FilterContextType, PortfolioTabType, ProfileTabType } from '@/types/filters'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { usePathname, useSearchParams } from 'next/navigation'

interface FilterContextValue {
  filterType: FilterContextType
  portfolioTab?: PortfolioTabType
  profileTab?: ProfileTabType
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined)

interface FilterProviderProps {
  children: ReactNode
  filterType: FilterContextType
  portfolioTab?: PortfolioTabType
  profileTab?: ProfileTabType
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children, filterType, portfolioTab, profileTab }) => {
  const dispatch = useAppDispatch()
  const { actions } = useFilterRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (actions) {
      if (!pathname.includes('/marketplace')) dispatch(actions.clearFilters())

      const defaultSearch = searchParams.get('search')
      if (defaultSearch) {
        dispatch(actions.setSearch(defaultSearch))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return <FilterContext.Provider value={{ filterType, portfolioTab, profileTab }}>{children}</FilterContext.Provider>
}

export const useFilterContext = (): FilterContextValue => {
  const context = useContext(FilterContext)
  if (!context) {
    // Default to marketplace if no context is provided (backwards compatibility)
    return { filterType: 'marketplace' }
  }
  return context
}
