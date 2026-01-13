'use client'

import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react'
import { FilterContextType } from '@/types/filters'
import { ProfileTabType } from '@/state/reducers/portfolio/profile'
import { CategoryTabType } from '@/state/reducers/category/category'
import { useAppDispatch } from '@/state/hooks'
import { usePathname } from 'next/navigation'
import { setFilterPanelOpen } from '@/state/reducers/filterPanel'
import { Address, useWindowSize } from 'ethereum-identity-kit'
import { useFilterUrlSync } from '@/hooks/filters/useFilterUrlSync'
import { clearBulkSelect, setBulkSelectIsSelecting } from '@/state/reducers/modals/bulkSelectModal'

interface FilterContextValue {
  filterType: FilterContextType
  profileTab?: ProfileTabType
  categoryTab?: CategoryTabType
  profileAddress?: Address | string
}

const FilterContext = createContext<FilterContextValue | undefined>(undefined)

interface FilterProviderProps {
  children: ReactNode
  filterType: FilterContextType
  profileTab?: ProfileTabType
  categoryTab?: CategoryTabType
  profileAddress?: Address | string
  isOwner?: boolean // For profile page to check watchlist access
}

export const FilterProvider: React.FC<FilterProviderProps> = ({
  children,
  filterType,
  profileTab,
  categoryTab,
  profileAddress,
  isOwner = true,
}) => {
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const { width: windowWidth } = useWindowSize()
  const previousPathRef = useRef<string | null>(null)

  // Close filters on mobile when navigating to a different page
  useEffect(() => {
    const isMobile = windowWidth !== null && windowWidth < 1024

    // Only close on mobile and when navigating to a different page (not on initial mount)
    if (isMobile && previousPathRef.current !== null && previousPathRef.current !== pathname) {
      dispatch(setFilterPanelOpen(false))
    }

    previousPathRef.current = pathname
  }, [pathname, windowWidth, dispatch])

  useEffect(() => {
    dispatch(setBulkSelectIsSelecting(false))
    dispatch(clearBulkSelect())
  }, [pathname, dispatch])

  useEffect(() => {
    if (windowWidth !== null && windowWidth > 1024) {
      dispatch(setFilterPanelOpen(true))
    } else {
      dispatch(setFilterPanelOpen(false))
    }
  }, [windowWidth, dispatch])

  return (
    <FilterContext.Provider value={{ filterType, profileTab, categoryTab, profileAddress }}>
      <FilterUrlSyncWrapper filterType={filterType} isOwner={isOwner}>
        {children}
      </FilterUrlSyncWrapper>
    </FilterContext.Provider>
  )
}

// Inner component that handles URL sync (must be inside FilterContext.Provider)
interface FilterUrlSyncWrapperProps {
  children: ReactNode
  filterType: FilterContextType
  isOwner: boolean
}

const FilterUrlSyncWrapper: React.FC<FilterUrlSyncWrapperProps> = ({ children, filterType, isOwner }) => {
  // This hook handles all URL <-> Redux sync
  useFilterUrlSync({ filterType, isOwner })

  return <>{children}</>
}

export const useFilterContext = (): FilterContextValue => {
  const context = useContext(FilterContext)
  if (!context) {
    // Default to marketplace if no context is provided (backwards compatibility)
    return { filterType: 'marketplace' }
  }
  return context
}
