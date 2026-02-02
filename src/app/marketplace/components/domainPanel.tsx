'use client'

import React from 'react'
import { useDomains } from '../hooks/useDomains'
import Domains from '@/components/domains'
import { useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { selectMarketplace } from '@/state/reducers/marketplace/marketplace'
import { SelectAllProvider } from '@/context/selectAll'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'
import { useUserContext } from '@/context/user'
import BulkSelect from '@/components/ui/bulkSelect'

const DomainPanel = () => {
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains } = useDomains()
  // const { isNavbarVisible } = useNavbar()
  const { selectedTab } = useAppSelector(selectMarketplace)
  const { authStatus } = useUserContext()

  // // Local state for search input to prevent glitchy typing
  // const [localSearch, setLocalSearch] = useState(selectors.filters.search || '')
  // const debounceRef = useRef<NodeJS.Timeout | null>(null)
  // const userHasTyped = useRef(false)

  // // Sync local state from Redux only on initial page load
  // // Once user starts typing, local state becomes the source of truth
  // useEffect(() => {
  //   if (!userHasTyped.current) {
  //     setLocalSearch(selectors.filters.search || '')
  //   }
  // }, [selectors.filters.search])

  // // Debounced search handler - only updates Redux, useFilterUrlSync handles URL
  // const handleSearchChange = (value: string) => {
  //   userHasTyped.current = true
  //   setLocalSearch(value)

  //   // Clear previous timeout
  //   if (debounceRef.current) {
  //     clearTimeout(debounceRef.current)
  //   }

  //   // Debounce the Redux update (URL is handled by useFilterUrlSync)
  //   debounceRef.current = setTimeout(() => {
  //     dispatch(actions.setSearch(value))
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
      <div className='z-0 flex w-full flex-col'>
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
        <BulkSelect pageType='marketplace' />
      </div>
    </SelectAllProvider>
  )
}

export default DomainPanel
