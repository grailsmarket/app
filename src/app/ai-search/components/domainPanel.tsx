'use client'

import React from 'react'
import { useAiSearchDomains } from '../hooks/useAiSearchDomains'
import Domains from '@/components/domains'
import { useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { selectAiSearch } from '@/state/reducers/aiSearch/aiSearch'
import { SelectAllProvider } from '@/context/selectAll'
import { useUserContext } from '@/context/user'
import BulkSelect from '@/components/ui/bulkSelect'

const MIN_SEARCH_LENGTH = 3

const DomainPanel = () => {
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open
  const search = selectors.filters.search || ''
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains, total: totalDomains } = useAiSearchDomains()
  const { selectedTab } = useAppSelector(selectAiSearch)
  const { authStatus } = useUserContext()

  if (search.trim().length < MIN_SEARCH_LENGTH) {
    return (
      <div className='flex w-full flex-col items-center justify-center py-20 opacity-50'>
        <p className='text-xl'>Type a name to search with AI</p>
      </div>
    )
  }

  return (
    <SelectAllProvider
      loadedDomains={domains}
      totalCount={totalDomains}
      filters={selectors.filters}
      searchTerm={search}
      isAuthenticated={authStatus === 'authenticated'}
    >
      <div className='relative z-0 flex w-full flex-col'>
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
          noResultsLabel='Enter a term to search with AI'
        />
        <BulkSelect pageType='marketplace' />
      </div>
    </SelectAllProvider>
  )
}

export default DomainPanel
