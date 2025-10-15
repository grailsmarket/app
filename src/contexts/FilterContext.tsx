'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { FilterContextType, PortfolioTabType } from '@/types/filters'

interface FilterContextValue {
  filterType: FilterContextType
  portfolioTab?: PortfolioTabType
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined)

interface FilterProviderProps {
  children: ReactNode
  filterType: FilterContextType
  portfolioTab?: PortfolioTabType
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children, filterType, portfolioTab }) => {
  return <FilterContext.Provider value={{ filterType, portfolioTab }}>{children}</FilterContext.Provider>
}

export const useFilterContext = (): FilterContextValue => {
  const context = useContext(FilterContext)
  if (!context) {
    // Default to marketplace if no context is provided (backwards compatibility)
    return { filterType: 'marketplace' }
  }
  return context
}
