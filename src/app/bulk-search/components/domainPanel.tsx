'use client'

import React from 'react'
import { useBulkSearchDomains } from '../hooks/useBulkSearchDomains'
import Domains from '@/components/domains'
import { useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { selectBulkSearch } from '@/state/reducers/bulkSearch/bulkSearch'
import { SelectAllProvider } from '@/context/selectAll'
import { useUserContext } from '@/context/user'
import BulkSelect from '@/components/ui/bulkSelect'

const DomainPanel = () => {
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains, total: totalDomains } = useBulkSearchDomains()
  const { selectedTab, searchTerms } = useAppSelector(selectBulkSearch)
  const { authStatus } = useUserContext()

  if (!searchTerms) {
    return (
      <div className='flex w-full flex-col items-center justify-center py-20 opacity-50'>
        <p className='text-xl'>Enter names above and click Search to see results</p>
      </div>
    )
  }

  return (
    <SelectAllProvider
      loadedDomains={domains}
      totalCount={totalDomains}
      filters={selectors.filters}
      searchTerm={searchTerms}
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
        />
        <BulkSelect pageType='marketplace' />
      </div>
    </SelectAllProvider>
  )
}

export default DomainPanel
