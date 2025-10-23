'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { FilterContextType, PortfolioTabType, ProfileTabType } from '@/types/filters'

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
