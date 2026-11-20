'use client'

import { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useAppDispatch } from '@/state/hooks'
import { useFilterRouter } from './useFilterRouter'
import { FilterContextType } from '@/types/filters/name'
import {
  URL_PARAMS,
  serializeFiltersToUrl,
  serializeFeedFiltersToUrl,
  serializeCategoriesPageFiltersToUrl,
  deserializeFiltersFromUrl,
  getTabFromParams,
  BaseFilterState,
  ParsedUrlFilters,
  CategoriesPageFilterState,
} from '@/utils/filterUrlParams'
import type { FeedFiltersState } from '@/types/filters/feed'
import { ActionCreatorWithPayload } from '@reduxjs/toolkit'
import type { Address } from 'viem'
import { debounce } from 'lodash'

// Import tab constants
import { PROFILE_TABS } from '@/constants/domains/portfolio/tabs'
import { MARKETPLACE_TABS } from '@/constants/domains/marketplace/tabs'
import { CATEGORY_TABS } from '@/constants/domains/category/tabs'
import { CATEGORIES_PAGE_TABS } from '@/constants/categories/categoriesPageTabs'
import { BULK_SEARCH_TABS } from '@/constants/domains/bulkSearch/tabs'
import { FEED_TABS } from '@/constants/filters/feed'

// Import tab change actions
import { changeTab } from '@/state/reducers/portfolio/profile'
import { changeMarketplaceTab } from '@/state/reducers/marketplace/marketplace'
import { changeCategoryTab } from '@/state/reducers/category/category'
import { changeCategoriesPageTab } from '@/state/reducers/categoriesPage/categoriesPage'
import { changeBulkSearchTab } from '@/state/reducers/bulkSearch/bulkSearch'
import { FeedFilterActions } from '@/state/reducers/filters/feedFilters'
import { openProfileFilters } from '@/state/reducers/filters/profileFilters'
import {
  setCategoriesPageSearch,
  setCategoriesPageType,
  setCategoriesPageSort,
  setCategoriesPageSortDirection,
} from '@/state/reducers/filters/categoriesPageFilters'

interface UseFilterUrlSyncOptions {
  filterType: FilterContextType
  profileAddress?: Address
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
    case 'bulkSearch':
      return BULK_SEARCH_TABS[0].value
    case 'feed':
      return FEED_TABS[0].value
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
    case 'bulkSearch':
      return changeBulkSearchTab
    case 'feed':
      return FeedFilterActions.setSelectedTab
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
    case 'bulkSearch':
      return BULK_SEARCH_TABS.find((t) => t.value === value) || BULK_SEARCH_TABS[0]
    case 'feed':
      return FEED_TABS.find((t) => t.value === value) || FEED_TABS[0]
    default:
      return { label: 'Names', value: 'names' }
  }
}

// Validate tab value is allowed
function isValidTab(filterType: FilterContextType, tabValue: string): boolean {
  const tabs =
    filterType === 'profile'
      ? PROFILE_TABS
      : filterType === 'marketplace'
        ? MARKETPLACE_TABS
        : filterType === 'category'
          ? CATEGORY_TABS
          : filterType === 'categoriesPage'
            ? CATEGORIES_PAGE_TABS
            : filterType === 'bulkSearch'
              ? BULK_SEARCH_TABS
              : filterType === 'feed'
                ? FEED_TABS
                : MARKETPLACE_TABS

  return tabs.some((t) => t.value === tabValue)
}

export function useFilterUrlSync(options: UseFilterUrlSyncOptions) {
  const { filterType, profileAddress } = options

  const dispatch = useAppDispatch()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const {
    actions,
    selectors,
    emptyFilterState,
    profileTab,
    marketplaceTab,
    categoryTab,
    categoriesPageTab,
    bulkSearchTab,
    feedTab,
  } = useFilterRouter()

  // Refs to prevent infinite loops
  const isSyncingFromUrl = useRef(false)
  const lastWrittenUrl = useRef<string | null>(null)
  const lastReadUrl = useRef<string | null>(null)
  const [pendingUrlFilters, setPendingUrlFilters] = useState<{
    filters: ParsedUrlFilters
    tab: string
    locationKey: string
  } | null>(null)
  const [syncPhase, setSyncPhase] = useState<'initializing' | 'applying' | 'ready'>('initializing')
  const queryString = searchParams.toString()
  const locationKey = queryString ? `${pathname}?${queryString}` : pathname

  const defaultTab = getDefaultTab(filterType)
  const tabChangeAction = getTabChangeAction(filterType)

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
      case 'bulkSearch':
        return bulkSearchTab?.value || defaultTab
      case 'feed':
        return feedTab?.value || defaultTab
      default:
        return defaultTab
    }
  }, [filterType, profileTab, marketplaceTab, categoryTab, categoriesPageTab, bulkSearchTab, feedTab, defaultTab])

  // Apply filters from URL to Redux
  const applyFiltersFromUrl = useCallback(
    (urlFilters: ParsedUrlFilters) => {
      if (!actions) return

      // Categories tab of the categories page: its slice uses its own action names
      // (setCategoriesPage*), so dispatch them directly instead of the generic actions
      if (filterType === 'categoriesPage') {
        const urlTab = urlFilters.tab && isValidTab(filterType, urlFilters.tab) ? urlFilters.tab : defaultTab
        if (urlTab === 'categories') {
          if (urlFilters.search !== undefined) dispatch(setCategoriesPageSearch(urlFilters.search))
          if (urlFilters.catType !== undefined) dispatch(setCategoriesPageType(urlFilters.catType))
          if (urlFilters.catSort !== undefined) dispatch(setCategoriesPageSort(urlFilters.catSort))
          if (urlFilters.catDir !== undefined) dispatch(setCategoriesPageSortDirection(urlFilters.catDir))
          return
        }
      }

      // Apply search
      if (urlFilters.search !== undefined && actions.setSearch) {
        dispatch(actions.setSearch(urlFilters.search))
      }

      if (filterType === 'feed') {
        if (urlFilters.categories !== undefined) {
          dispatch((actions as any).addCategories(urlFilters.categories))
        }

        if (urlFilters.market !== undefined && actions.setMarketFilters) {
          const currentMarket = (selectors.filters as any).market || {}
          dispatch(actions.setMarketFilters({ ...currentMarket, ...urlFilters.market }))
        }

        if (urlFilters.activityType !== undefined && actions.setFiltersType) {
          dispatch(actions.setFiltersType(urlFilters.activityType))
        }

        if (urlFilters.priceRange !== undefined && actions.setPriceRange) {
          dispatch(actions.setPriceRange(urlFilters.priceRange))
        }

        return
      }

      // Apply sort
      if (urlFilters.sort !== undefined && actions.setSort) {
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

      // Changing denomination clears the price range, so apply it first.
      if (urlFilters.denomination !== undefined && actions.setPriceDenomination) {
        dispatch(actions.setPriceDenomination(urlFilters.denomination))
      }

      // Apply price range
      if (urlFilters.priceRange !== undefined && actions.setPriceRange) {
        dispatch(actions.setPriceRange(urlFilters.priceRange))
      }

      // Apply offer range
      if (urlFilters.offerRange !== undefined && actions.setOfferRange) {
        dispatch(actions.setOfferRange(urlFilters.offerRange))
      }

      if (urlFilters.watchersCount !== undefined && actions.setWatchersCount) {
        dispatch(actions.setWatchersCount(urlFilters.watchersCount))
      }

      if (urlFilters.viewCount !== undefined && actions.setViewCount) {
        dispatch(actions.setViewCount(urlFilters.viewCount))
      }

      if (urlFilters.clubsCount !== undefined && actions.setClubsCount) {
        dispatch(actions.setClubsCount(urlFilters.clubsCount))
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
      if (urlFilters.type !== undefined && actions.setFiltersType && !Array.isArray(selectors.filters.type)) {
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

      // Apply creation date
      if (urlFilters.creationDate !== undefined && actions.setCreationDate) {
        dispatch(actions.setCreationDate(urlFilters.creationDate))
      }
    },
    [actions, dispatch, selectors.filters, filterType, defaultTab]
  )

  // Initialize once for other pages, and on incoming profile navigation. Ignore
  // replacements made by this hook: manual filter changes remain the source of truth.
  useEffect(() => {
    if (lastReadUrl.current === locationKey) return
    if (lastWrittenUrl.current === locationKey) {
      lastReadUrl.current = locationKey
      lastWrittenUrl.current = null
      return
    }
    if (lastReadUrl.current !== null && filterType !== 'profile') {
      lastReadUrl.current = locationKey
      return
    }

    lastReadUrl.current = locationKey
    isSyncingFromUrl.current = true
    const params = new URLSearchParams(queryString)
    const urlFilters = deserializeFiltersFromUrl(params)
    const urlTab = getTabFromParams(params, defaultTab)
    const validTab = isValidTab(filterType, urlTab) ? urlTab : defaultTab
    const hasFilters = Object.keys(urlFilters).some((key) => key !== 'tab')

    if (filterType === 'profile' && profileAddress) {
      const tab = PROFILE_TABS.find((item) => item.value === validTab) ?? PROFILE_TABS[0]
      dispatch(openProfileFilters({ address: profileAddress, resetTab: hasFilters ? tab.value : undefined }))
    }

    const shouldSelectTab = filterType === 'profile' || hasFilters || !!urlFilters.tab
    const targetTab = shouldSelectTab ? validTab : currentTab
    if (shouldSelectTab) {
      dispatch(tabChangeAction(findTabByValue(filterType, targetTab)))
    }

    setPendingUrlFilters({ filters: { ...urlFilters, tab: targetTab }, tab: targetTab, locationKey })
    setSyncPhase('applying')
  }, [locationKey, queryString, profileAddress, filterType, defaultTab, currentTab, dispatch, tabChangeAction])

  // Wait for the render containing both the destination profile and the selected
  // tab. Actions captured before that render still belong to the previous tab.
  useEffect(() => {
    const pending = pendingUrlFilters
    if (syncPhase !== 'applying' || !pending || pending.locationKey !== locationKey || currentTab !== pending.tab)
      return

    if (!(filterType === 'profile' && pending.tab === 'broker')) applyFiltersFromUrl(pending.filters)
    setPendingUrlFilters(null)
    setSyncPhase('ready')
  }, [syncPhase, currentTab, applyFiltersFromUrl, pendingUrlFilters, locationKey, filterType])

  useEffect(() => {
    if (syncPhase === 'ready' && !pendingUrlFilters) {
      isSyncingFromUrl.current = false
    }
  }, [syncPhase, pendingUrlFilters])

  // Debounced URL update function
  const debouncedUpdateUrl = useMemo(
    () =>
      debounce((filters: BaseFilterState | CategoriesPageFilterState, tab: string) => {
        if (isSyncingFromUrl.current) return

        let newUrl: string
        if (
          (filterType === 'profile' && tab === 'broker') ||
          ((filterType === 'categoriesPage' || filterType === 'category') && tab === 'holders')
        ) {
          newUrl = new URLSearchParams({ tab }).toString()
        } else if (filterType === 'feed') {
          newUrl = serializeFeedFiltersToUrl(
            filters as unknown as FeedFiltersState,
            emptyFilterState as FeedFiltersState
          )
        } else if (filterType === 'categoriesPage' && tab === 'categories') {
          newUrl = serializeCategoriesPageFiltersToUrl(
            filters as CategoriesPageFilterState,
            emptyFilterState as CategoriesPageFilterState,
            tab,
            defaultTab
          )
        } else {
          newUrl = serializeFiltersToUrl(
            filters as BaseFilterState,
            tab,
            defaultTab,
            emptyFilterState as BaseFilterState
          )
        }

        if (filterType === 'profile') {
          const url = new URL(window.location.href)
          if (url.pathname !== pathname) return
          const currentLocation = url.searchParams.size ? `${pathname}?${url.searchParams}` : pathname
          if (currentLocation !== lastReadUrl.current && currentLocation !== lastWrittenUrl.current) return
          for (const key of Object.values(URL_PARAMS)) url.searchParams.delete(key)
          new URLSearchParams(newUrl).forEach((value, key) => url.searchParams.set(key, value))
          const nextLocation = url.searchParams.size ? `${pathname}?${url.searchParams}` : pathname
          if (nextLocation === currentLocation) return
          lastWrittenUrl.current = nextLocation
          window.history.replaceState(null, '', nextLocation + url.hash)
          return
        }

        const urlString = newUrl ? `${pathname}?${newUrl}` : pathname
        if (urlString === lastReadUrl.current) return

        lastWrittenUrl.current = urlString
        router.replace(urlString, { scroll: false })
      }, 300),
    [pathname, router, defaultTab, emptyFilterState, filterType]
  )

  // Redux → URL: Update URL when filters or tab change
  useEffect(() => {
    // Skip if we're syncing from URL or not initialized
    if (isSyncingFromUrl.current || syncPhase !== 'ready') return

    // Skip if filters aren't loaded yet
    if (!selectors.filters) return

    debouncedUpdateUrl(selectors.filters as BaseFilterState, currentTab)

    // Cleanup debounce on unmount
    return () => {
      debouncedUpdateUrl.cancel()
    }
  }, [selectors.filters, currentTab, debouncedUpdateUrl, syncPhase, locationKey])

  return {
    currentTab,
    isInitialized:
      syncPhase === 'ready' && (lastReadUrl.current === locationKey || lastWrittenUrl.current === locationKey),
  }
}
