'use client'

import React, { createContext, useContext, useRef, useCallback } from 'react'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectBulkSelect,
  setBulkSelectDomains,
  setBulkSelectPreviousListings,
  startSelectAll,
  updateSelectAllProgress,
  finishSelectAll,
  cancelSelectAll,
  setSelectAllError,
  setBulkSelectWatchlistIds,
} from '@/state/reducers/modals/bulkSelectModal'
import { MarketplaceDomainType, DomainListingType } from '@/types/domains'
import { fetchDomains } from '@/api/domains/fetchDomains'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'
import { PortfolioFiltersState } from '@/types/filters'
import { Address } from 'viem'
import { getWatchlist } from '@/api/watchlist/getWatchlist'

const SELECT_ALL_BATCH_SIZE = 50

interface SelectAllContextType {
  canSelectAll: boolean
  startSelectAll: () => void
  cancelSelectAll: () => void
}

const SelectAllContext = createContext<SelectAllContextType | null>(null)

interface SelectAllProviderProps {
  children: React.ReactNode
  loadedDomains: MarketplaceDomainType[]
  totalCount: number
  filters: MarketplaceFiltersState | PortfolioFiltersState
  searchTerm: string
  ownerAddress?: Address
  category?: string
  isWatchlist?: boolean
  isAuthenticated?: boolean
}

export const SelectAllProvider: React.FC<SelectAllProviderProps> = ({
  children,
  loadedDomains,
  totalCount,
  filters,
  searchTerm,
  ownerAddress,
  category,
  isWatchlist = false,
  isAuthenticated = false,
}) => {
  const dispatch = useAppDispatch()
  const { selectAll, isSelecting } = useAppSelector(selectBulkSelect)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { domains } = useAppSelector(selectBulkSelect)

  const canSelectAll = isSelecting && !selectAll?.isLoading && totalCount > 0 && domains.length !== totalCount

  const handleStartSelectAll = useCallback(async () => {
    if (!canSelectAll || selectAll?.isLoading) return

    // Create new abort controller for this operation
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // Start loading state
    dispatch(startSelectAll({ total: totalCount }))

    try {
      // Start with already loaded domains
      const allDomains: MarketplaceDomainType[] = [...loadedDomains]
      let currentLoaded = loadedDomains.length

      // Update progress with initial loaded count
      dispatch(updateSelectAllProgress(currentLoaded))

      // Calculate how many more pages we need to fetch
      const remainingCount = totalCount - loadedDomains.length

      if (remainingCount > 0) {
        // Calculate starting page based on what's already loaded
        // Assuming default fetch limit, we need to figure out which page to start from
        const startPage = Math.ceil(loadedDomains.length / SELECT_ALL_BATCH_SIZE)
        const totalPages = Math.ceil(totalCount / SELECT_ALL_BATCH_SIZE)

        console.log('Start page:', startPage, 'Total pages:', totalPages)

        // Fetch remaining pages
        for (let page = startPage; page <= totalPages; page++) {
          // Check if cancelled
          if (signal.aborted) {
            // User cancelled - don't select anything, just stop
            dispatch(cancelSelectAll())
            return
          }

          try {
            const result = await (isWatchlist && isAuthenticated
              ? getWatchlist({
                  limit: SELECT_ALL_BATCH_SIZE,
                  pageParam: page,
                  searchTerm,
                  filters,
                })
              : fetchDomains({
                  limit: SELECT_ALL_BATCH_SIZE,
                  pageParam: page,
                  filters,
                  searchTerm,
                  ownerAddress,
                  category,
                  isAuthenticated,
                  signal,
                }))

            const domains = (
              isWatchlist && isAuthenticated
                ? // @ts-expect-error the types do exist
                  result.results
                : // @ts-expect-error the types do exist
                  result.domains
            ) as MarketplaceDomainType[]

            // Add new domains (avoid duplicates by checking name)
            const existingNames = new Set(allDomains.map((d) => d.name))
            const newDomains = domains.filter((d) => !existingNames.has(d.name))
            allDomains.push(...newDomains)
            currentLoaded = allDomains.length

            // Update progress
            dispatch(updateSelectAllProgress(currentLoaded))
          } catch (error) {
            // Check if it's an abort error
            if (error instanceof Error && error.name === 'AbortError') {
              // User cancelled - don't select anything, just stop
              dispatch(cancelSelectAll())
              return
            }

            // Network error - select what we have and show warning
            console.error('Error fetching page:', page, error)

            // Select what we have so far
            selectDomainsAndListings(allDomains)

            if (isWatchlist && isAuthenticated) {
              // @ts-expect-error the types do exist
              dispatch(setBulkSelectWatchlistIds(allDomains.map((d) => d.watchlist_record_id)))
            }

            // Set error message
            dispatch(setSelectAllError(`Could not load all domains. Selected ${allDomains.length} of ${totalCount}.`))
            return
          }
        }
      }

      // Successfully fetched all - select them
      selectDomainsAndListings(allDomains)

      if (isWatchlist && isAuthenticated) {
        // @ts-expect-error the types do exist
        dispatch(setBulkSelectWatchlistIds(allDomains.map((d) => d.watchlist_record_id)))
      }

      // Finish loading
      dispatch(finishSelectAll())
    } catch (error) {
      // Check if it's an abort error
      if (error instanceof Error && error.name === 'AbortError') {
        dispatch(cancelSelectAll())
        return
      }

      console.error('Error in select all:', error)
      dispatch(setSelectAllError('An error occurred while selecting domains.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    canSelectAll,
    selectAll?.isLoading,
    totalCount,
    loadedDomains,
    filters,
    searchTerm,
    ownerAddress,
    category,
    isAuthenticated,
    dispatch,
    isWatchlist,
  ])

  const selectDomainsAndListings = (domains: MarketplaceDomainType[]) => {
    // Set domains
    dispatch(setBulkSelectDomains(domains))

    // Extract and set Grails listings
    const allListings: DomainListingType[] = []
    domains.forEach((domain) => {
      const grailsListings = domain.listings?.filter((listing) => listing.source === 'grails') || []
      grailsListings.forEach((listing) => {
        if (!allListings.some((l) => l.id === listing.id)) {
          allListings.push(listing)
        }
      })
    })
    dispatch(setBulkSelectPreviousListings(allListings))
  }

  const handleCancelSelectAll = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    dispatch(cancelSelectAll())
  }, [dispatch])

  return (
    <SelectAllContext.Provider
      value={{
        canSelectAll,
        startSelectAll: handleStartSelectAll,
        cancelSelectAll: handleCancelSelectAll,
      }}
    >
      {children}
    </SelectAllContext.Provider>
  )
}

export const useSelectAll = () => {
  const context = useContext(SelectAllContext)
  // Return null if used outside of SelectAllProvider - this is intentional
  // as BulkSelect may render before/without the provider
  return context
}
