'use client'

import React from 'react'
import { useCategoriesPageDomains } from '../hooks/useCategoriesPageDomains'
import Domains from '@/components/domains'
import { useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { selectCategoriesPage } from '@/state/reducers/categoriesPage/categoriesPage'
import { SelectAllProvider } from '@/context/selectAll'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'
import { useUserContext } from '@/context/user'
import BulkSelect from '@/components/ui/bulkSelect'

const CategoriesPageDomainsPanel = () => {
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains } = useCategoriesPageDomains()
  // const { isNavbarVisible } = useNavbar()
  const { categoriesPage } = useAppSelector(selectCategoriesPage)
  const { selectedTab } = categoriesPage
  const { authStatus } = useUserContext()

  // Local state for search input to prevent glitchy typing
  // const [localSearch, setLocalSearch] = useState(selectors.filters.search || '')
  // const debounceRef = useRef<NodeJS.Timeout | null>(null)
  // const userHasTyped = useRef(false)

  // // Sync local state from Redux/URL only on initial page load
  // // Once user starts typing, local state becomes the source of truth
  // useEffect(() => {
  //   if (!userHasTyped.current) {
  //     setLocalSearch(selectors.filters.search || '')
  //   }
  // }, [selectors.filters.search])

  // // Helper to build URL with current tab preserved
  // const buildUrl = (searchParam?: string) => {
  //   const params = new URLSearchParams()
  //   // Preserve current tab (only add if not default 'categories' tab)
  //   if (selectedTab.value !== 'categories') {
  //     params.set('tab', selectedTab.value)
  //   }
  //   if (searchParam) {
  //     params.set('search', searchParam)
  //   }
  //   const queryString = params.toString()
  //   return queryString ? `/categories?${queryString}` : '/categories'
  // }

  // // Debounced search handler
  // const handleSearchChange = (value: string) => {
  //   userHasTyped.current = true
  //   setLocalSearch(value)

  //   // Clear previous timeout
  //   if (debounceRef.current) {
  //     clearTimeout(debounceRef.current)
  //   }

  //   // Debounce the Redux/URL update
  //   debounceRef.current = setTimeout(() => {
  //     dispatch(actions.setSearch(value))

  //     const searchTerm = value.toLowerCase().trim()
  //     if (searchTerm.length === 0) {
  //       router.push(buildUrl())
  //       return
  //     }

  //     // Skip URL update if search is too long (bulk search with many names)
  //     // The search will still work in the app via Redux state
  //     if (searchTerm.length > MAX_SEARCH_URL_LENGTH) {
  //       return
  //     }

  //     const isBulkSearching = searchTerm.replaceAll(' ', ',').split(',').length > 1
  //     if (isBulkSearching) {
  //       const normalizedSearch = searchTerm
  //         .replaceAll(' ', ',')
  //         .split(',')
  //         .map((query) => normalizeName(query.toLowerCase().trim()))
  //         .filter((query) => query.length > 2)
  //         .join(',')
  //       router.push(buildUrl(normalizedSearch))
  //     } else {
  //       router.push(buildUrl(normalizeName(searchTerm)))
  //     }
  //   }, 300)
  // }

  // // Cleanup timeout on unmount
  // useEffect(() => {
  //   return () => {
  //     if (debounceRef.current) {
  //       clearTimeout(debounceRef.current)
  //     }
  //   }
  // }, [])

  return (
    <SelectAllProvider
      loadedDomains={domains}
      totalCount={0}
      filters={selectors.filters as MarketplaceFiltersState}
      searchTerm={selectors.filters.search}
      isAuthenticated={authStatus === 'authenticated'}
      disableSelectAll={true}
    >
      <Domains
        domains={domains}
        loadingRowCount={20}
        paddingBottom='80px'
        filtersOpen={filtersOpen}
        noResults={!domainsLoading && domains?.length === 0}
        isLoading={domainsLoading}
        hasMoreDomains={hasMoreDomains}
        fetchMoreDomains={() => {
          if (hasMoreDomains && !domainsLoading) {
            fetchMoreDomains()
          }
        }}
        showPreviousOwner={selectedTab.value === 'available' || selectedTab.value === 'premium'}
      />
      <BulkSelect pageType='categories' />
    </SelectAllProvider>
  )
}

export default CategoriesPageDomainsPanel
