'use client'

import React from 'react'
import { useCategoriesPageDomains } from '../hooks/useCategoriesPageDomains'
import Domains from '@/components/domains'
import { useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { selectCategoriesPage } from '@/state/reducers/categoriesPage/categoriesPage'
import { SelectAllProvider } from '@/context/selectAll'
import { useUserContext } from '@/context/user'
import BulkSelect from '@/components/ui/bulkSelect'

type CategoriesPageDomainsResult = ReturnType<typeof useCategoriesPageDomains>

type CategoriesPageDomainsPanelProps = CategoriesPageDomainsResult

const CategoriesPageDomainsPanel = ({
  domains,
  domainsLoading,
  fetchMoreDomains,
  hasMoreDomains,
  totalDomains,
}: CategoriesPageDomainsPanelProps) => {
  const { selectors } = useFilterRouter()
  const filtersOpen = selectors.filters.open
  const { categoriesPage } = useAppSelector(selectCategoriesPage)
  const { selectedTab } = categoriesPage
  const { authStatus } = useUserContext()

  return (
    <SelectAllProvider
      loadedDomains={domains}
      totalCount={totalDomains ?? 0}
      filters={selectors.filters}
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
