'use client'

import { useEffect, useRef, useMemo, useCallback } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from './useFilterRouter'
import { FilterContextType } from '@/types/filters'
import {
  serializeFiltersToUrl,
  serializeCategoriesPageFiltersToUrl,
  deserializeFiltersFromUrl,
  getTabFromParams,
  BaseFilterState,
  ParsedUrlFilters,
  CategoriesPageFilterState,
} from '@/utils/filterUrlParams'
import { ActionCreatorWithPayload } from '@reduxjs/toolkit'
import { debounce } from 'lodash'

// Import tab constants
import { PROFILE_TABS } from '@/constants/domains/portfolio/tabs'
import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'
import { CATEGORY_TABS } from '@/constants/domains/category/tabs'
import { CATEGORIES_PAGE_TABS } from '@/constants/categories/categoriesPageTabs'

// Import empty filter states for comparison
import { emptyFilterState as marketplaceEmptyFilterState } from '@/state/reducers/filters/marketplaceFilters'
import { emptyFilterState as profileDomainsEmptyFilterState } from '@/state/reducers/filters/profileDomainsFilters'
import { emptyFilterState as categoryDomainsEmptyFilterState } from '@/state/reducers/filters/categoryDomainsFilters'
import { emptyFilterState as categoriesPageEmptyFilterState } from '@/state/reducers/filters/categoriesPageFilters'
import { emptyFilterState as categoriesNamesEmptyFilterState } from '@/state/reducers/filters/categoriesNamesFilters'
import { emptyFilterState as categoriesPremiumEmptyFilterState } from '@/state/reducers/filters/categoriesPremiumDomainsFilters'
import { emptyFilterState as categoriesAvailableEmptyFilterState } from '@/state/reducers/filters/categoriesAvailableDomainsFilters'

// Import tab change actions
import { changeTab } from '@/state/reducers/portfolio/profile'
import { changeMarketplaceTab } from '@/state/reducers/marketplace/marketplace'
import { changeCategoryTab } from '@/state/reducers/category/category'
import { changeCategoriesPageTab } from '@/state/reducers/categoriesPage/categoriesPage'

interface UseFilterUrlSyncOptions {
  filterType: FilterContextType
  isOwner?: boolean // For profile watchlist authorization check
}

// Get default tab value for each filter type
function getDefaultTab(filterType: FilterContextType): string {
  switch (filterType) {
    case 'profile':
      return PROFILE_TABS[0].value
    case 'marketplace':
      return MARKETPLACE_TABS[0].value
    case 'category':
      return CATEGORY_TABS[0].value
    case 'categoriesPage':
      return CATEGORIES_PAGE_TABS[0].value
    default:
      return 'names'
  }
}

// Get tab change action for each filter type
function getTabChangeAction(filterType: FilterContextType): ActionCreatorWithPayload<any> {
  switch (filterType) {
    case 'profile':
      return changeTab
    case 'marketplace':
      return changeMarketplaceTab
    case 'category':
      return changeCategoryTab
    case 'categoriesPage':
      return changeCategoriesPageTab
    default:
      return changeMarketplaceTab
  }
}

// Find tab object by value
function findTabByValue(filterType: FilterContextType, value: string) {
  switch (filterType) {
    case 'profile':
      return PROFILE_TABS.find((t) => t.value === value) || PROFILE_TABS[0]
    case 'marketplace':
      return MARKETPLACE_TABS.find((t) => t.value === value) || MARKETPLACE_TABS[0]
    case 'category':
      return CATEGORY_TABS.find((t) => t.value === value) || CATEGORY_TABS[0]
    case 'categoriesPage':
      return CATEGORIES_PAGE_TABS.find((t) => t.value === value) || CATEGORIES_PAGE_TABS[0]
    default:
      return { label: 'Names', value: 'names' }
  }
}

// Get empty filter state for each filter type
function getEmptyFilterState(filterType: FilterContextType): BaseFilterState | CategoriesPageFilterState {
  switch (filterType) {
    case 'profile':
      return profileDomainsEmptyFilterState as BaseFilterState
    case 'marketplace':
      return marketplaceEmptyFilterState as BaseFilterState
    case 'category':
      return categoryDomainsEmptyFilterState as BaseFilterState
    case 'categoriesPage':
      return categoriesPageEmptyFilterState as CategoriesPageFilterState
    default:
      return marketplaceEmptyFilterState as BaseFilterState
  }
}

// Validate tab value is allowed
function isValidTab(filterType: FilterContextType, tabValue: string, isOwner: boolean = true): boolean {
  const tabs =
    filterType === 'profile'
      ? PROFILE_TABS
      : filterType === 'marketplace'
        ? MARKETPLACE_TABS
        : filterType === 'category'
          ? CATEGORY_TABS
          : filterType === 'categoriesPage'
            ? CATEGORIES_PAGE_TABS
            : MARKETPLACE_TABS

  const isValidTabValue = tabs.some((t) => t.value === tabValue)

  // Special case: watchlist is only valid for profile owner
  if (filterType === 'profile' && tabValue === 'watchlist' && !isOwner) {
    return false
  }

  return isValidTabValue
}

export function useFilterUrlSync(options: UseFilterUrlSyncOptions) {
  const { filterType, isOwner = true } = options

  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { actions, selectors, profileTab, marketplaceTab, categoryTab, categoriesPageTab } = useFilterRouter()

  // Refs to prevent infinite loops
  const isSyncingFromUrl = useRef(false)
  const lastWrittenUrl = useRef<string>('')
  const isInitialized = useRef(false)
  const pendingUrlFilters = useRef<ParsedUrlFilters | null>(null)

  const defaultTab = getDefaultTab(filterType)
  const tabChangeAction = getTabChangeAction(filterType)
  const emptyFilterState = getEmptyFilterState(filterType)

  // Get current tab value from Redux
  const currentTab = useMemo(() => {
    switch (filterType) {
      case 'profile':
        return profileTab?.value || defaultTab
      case 'marketplace':
        return marketplaceTab?.value || defaultTab
      case 'category':
        return categoryTab?.value || defaultTab
      case 'categoriesPage':
        return categoriesPageTab?.value || defaultTab
      default:
        return defaultTab
    }
  }, [filterType, profileTab, marketplaceTab, categoryTab, categoriesPageTab, defaultTab])

  // Apply filters from URL to Redux
  const applyFiltersFromUrl = useCallback(
    (urlFilters: ParsedUrlFilters) => {
      if (!actions) return

      // Apply search
      if (urlFilters.search !== undefined) {
        dispatch(actions.setSearch(urlFilters.search))
      }

      // Apply sort
      if (urlFilters.sort !== undefined) {
        dispatch(actions.setSort(urlFilters.sort))
      }

      // Apply status (if action exists - activity tabs don't have status)
      if (urlFilters.status !== undefined && actions.setFiltersStatus) {
        // Set each status
        urlFilters.status.forEach((status, index) => {
          if (index === 0) {
            dispatch(actions.setFiltersStatus(status))
          } else {
            dispatch(actions.toggleFiltersStatus(status))
          }
        })
      }

      // Apply length
      if (urlFilters.length !== undefined && actions.setFiltersLength) {
        dispatch(actions.setFiltersLength(urlFilters.length))
      }

      // Apply price range
      if (urlFilters.priceRange !== undefined && actions.setPriceRange) {
        dispatch(actions.setPriceRange(urlFilters.priceRange))
      }

      // Apply offer range
      if (urlFilters.offerRange !== undefined && actions.setOfferRange) {
        dispatch(actions.setOfferRange(urlFilters.offerRange))
      }

      // Apply denomination
      if (urlFilters.denomination !== undefined && actions.setPriceDenomination) {
        dispatch(actions.setPriceDenomination(urlFilters.denomination))
      }

      // Apply categories
      if (urlFilters.categories !== undefined && actions.setFiltersCategory) {
        urlFilters.categories.forEach((category, index) => {
          if (index === 0) {
            dispatch(actions.setFiltersCategory(category))
          } else {
            dispatch(actions.toggleCategory(category))
          }
        })
      }

      // Apply type filters
      if (urlFilters.type !== undefined && actions.setFiltersType) {
        const currentType = (selectors.filters as any).type || {}
        dispatch(
          actions.setFiltersType({
            ...currentType,
            ...urlFilters.type,
          })
        )
      }

      // Apply market filters
      if (urlFilters.market !== undefined && actions.setMarketFilters) {
        const currentMarket = (selectors.filters as any).market || {}
        dispatch(
          actions.setMarketFilters({
            ...currentMarket,
            ...urlFilters.market,
          })
        )
      }

      // Apply text match filters
      if (urlFilters.textMatch !== undefined && actions.setTextMatchFilters) {
        const currentTextMatch = (selectors.filters as any).textMatch || {}
        dispatch(
          actions.setTextMatchFilters({
            ...currentTextMatch,
            ...urlFilters.textMatch,
          })
        )
      }

      // Apply text non-match filters
      if (urlFilters.textNonMatch !== undefined && actions.setTextNonMatchFilters) {
        const currentTextNonMatch = (selectors.filters as any).textNonMatch || {}
        dispatch(
          actions.setTextNonMatchFilters({
            ...currentTextNonMatch,
            ...urlFilters.textNonMatch,
          })
        )
      }

      // Activity type URL param is disabled for now - uncomment to re-enable
      // if (urlFilters.activityType !== undefined && actions.setFiltersType) {
      //   // For activity tabs, setFiltersType sets the first type, then we toggle the rest
      //   urlFilters.activityType.forEach((actType, index) => {
      //     if (index === 0) {
      //       dispatch(actions.setFiltersType(actType))
      //     } else if (actions.toggleFiltersType) {
      //       dispatch(actions.toggleFiltersType(actType))
      //     }
      //   })
      // }

      // Categories page filters
      if (urlFilters.catType !== undefined && actions.setFiltersType) {
        dispatch(actions.setFiltersType(urlFilters.catType))
      }

      if (urlFilters.catSort !== undefined && actions.setSort) {
        dispatch(actions.setSort(urlFilters.catSort))
      }

      if (urlFilters.catDir !== undefined && (actions as any).setSortDirection) {
        dispatch((actions as any).setSortDirection(urlFilters.catDir))
      }
    },
    [actions, dispatch, selectors.filters]
  )

  // URL → Redux: Initialize from URL on mount
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    const urlFilters = deserializeFiltersFromUrl(searchParams)
    const urlTab = getTabFromParams(searchParams, defaultTab)

    // Mark that we're syncing from URL
    isSyncingFromUrl.current = true

    // Validate and apply tab first
    const validTab = isValidTab(filterType, urlTab, isOwner) ? urlTab : defaultTab
    if (validTab !== defaultTab || urlFilters.tab) {
      const tabObj = findTabByValue(filterType, validTab)
      dispatch(tabChangeAction(tabObj))
    }

    // If tab was invalid (e.g., unauthorized watchlist), update URL
    if (urlTab !== validTab) {
      let newUrl: string
      if (filterType === 'categoriesPage' && validTab === 'categories') {
        newUrl = serializeCategoriesPageFiltersToUrl(
          selectors.filters as unknown as CategoriesPageFilterState,
          categoriesPageEmptyFilterState as CategoriesPageFilterState,
          validTab,
          defaultTab
        )
      } else {
        newUrl = serializeFiltersToUrl(
          selectors.filters as BaseFilterState,
          validTab,
          defaultTab,
          emptyFilterState as BaseFilterState
        )
      }
      const urlString = newUrl ? `${pathname}?${newUrl}` : pathname
      router.replace(urlString, { scroll: false })
      lastWrittenUrl.current = newUrl
    }

    // Store filters to be applied when actions are ready
    // Check if there are any URL filters to apply
    const hasFiltersToApply = Object.keys(urlFilters).some((key) => key !== 'tab')
    if (hasFiltersToApply) {
      pendingUrlFilters.current = urlFilters
    } else {
      // No filters to apply, reset sync flag
      requestAnimationFrame(() => {
        isSyncingFromUrl.current = false
      })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Apply pending URL filters when actions are ready
  useEffect(() => {
    if (!pendingUrlFilters.current || !actions) return

    // Apply the pending filters directly - no need to clear first
    // since URL filters will overwrite the relevant values
    applyFiltersFromUrl(pendingUrlFilters.current)
    pendingUrlFilters.current = null

    // Reset sync flag after all updates
    requestAnimationFrame(() => {
      isSyncingFromUrl.current = false
    })
  }, [actions, applyFiltersFromUrl, dispatch])

  // Debounced URL update function
  const debouncedUpdateUrl = useMemo(
    () =>
      debounce((filters: BaseFilterState | CategoriesPageFilterState, tab: string) => {
        if (isSyncingFromUrl.current) return

        let newUrl: string
        if (filterType === 'categoriesPage') {
          // Categories page has different filter types per tab
          if (tab === 'categories') {
            // Categories tab uses special categories page filters
            newUrl = serializeCategoriesPageFiltersToUrl(
              filters as CategoriesPageFilterState,
              categoriesPageEmptyFilterState as CategoriesPageFilterState,
              tab,
              defaultTab
            )
          } else {
            // Names, Premium, Available tabs use domain filters
            const tabEmptyState =
              tab === 'names'
                ? categoriesNamesEmptyFilterState
                : tab === 'premium'
                  ? categoriesPremiumEmptyFilterState
                  : categoriesAvailableEmptyFilterState
            newUrl = serializeFiltersToUrl(
              filters as BaseFilterState,
              tab,
              defaultTab,
              tabEmptyState as BaseFilterState
            )
          }
        } else {
          newUrl = serializeFiltersToUrl(
            filters as BaseFilterState,
            tab,
            defaultTab,
            emptyFilterState as BaseFilterState
          )
        }

        // Skip if URL hasn't changed
        if (newUrl === lastWrittenUrl.current) return

        lastWrittenUrl.current = newUrl
        const urlString = newUrl ? `${pathname}?${newUrl}` : pathname
        router.replace(urlString, { scroll: false })
      }, 300),
    [pathname, router, defaultTab, emptyFilterState, filterType]
  )

  // Redux → URL: Update URL when filters or tab change
  useEffect(() => {
    // Skip if we're syncing from URL or not initialized
    if (isSyncingFromUrl.current || !isInitialized.current) return

    // Skip if filters aren't loaded yet
    if (!selectors.filters) return

    debouncedUpdateUrl(selectors.filters as BaseFilterState, currentTab)

    // Cleanup debounce on unmount
    return () => {
      debouncedUpdateUrl.cancel()
    }
  }, [selectors.filters, currentTab, debouncedUpdateUrl])

  // NOTE: Browser back/forward navigation intentionally does NOT sync URL → Redux
  // URL params are only read on initial page load for sharing/bookmarking purposes
  // After initial load, Redux is the source of truth and URL is updated from Redux

  return {
    currentTab,
    isInitialized: isInitialized.current,
  }
}
