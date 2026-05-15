'use client'

import React, { useMemo } from 'react'
import Domains from '@/components/domains'
import { useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { Address } from 'ethereum-identity-kit'
import { useDomains } from '../hooks/useDomains'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import {
  PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS,
  PORTFOLIO_MY_LISTINGS_DISPLAYED_COLUMNS,
  PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS,
} from '@/constants/domains/marketplaceDomains'
import { SelectAllProvider } from '@/context/selectAll'
import { useDebounce } from '@/hooks/useDebounce'
import { useUserContext } from '@/context/user'
import BulkSelect from '@/components/ui/bulkSelect'
import SetEmailReminder from '@/components/ui/setEmailReminder'

interface Props {
  user: Address | undefined
  isMyProfile?: boolean
}

const DomainPanel: React.FC<Props> = ({ user, isMyProfile = false }) => {
  const { selectors } = useFilterRouter()
  const {
    domains,
    domainsLoading,
    fetchMoreDomains,
    hasMoreDomains,
    profileTotalDomains,
    totalListings,
    totalGraceDomains,
    totalWatchlistDomains,
    totalExpiredDomains,
  } = useDomains(user)
  const { selectedTab } = useAppSelector(selectUserProfile)
  const { authStatus } = useUserContext()
  const debouncedSearch = useDebounce(selectors.filters.search, 500)

  const displayedDetails = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS
      case 'grace':
        return PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS
      case 'listings':
        return PORTFOLIO_MY_LISTINGS_DISPLAYED_COLUMNS
      case 'watchlist':
        return PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS
    }
  }, [selectedTab.value])

  // Get total count based on selected tab
  const totalCount = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return profileTotalDomains
      case 'listings':
        return totalListings
      case 'grace':
        return totalGraceDomains
      case 'watchlist':
        return totalWatchlistDomains
      case 'expired':
        return totalExpiredDomains
      default:
        return 0
    }
  }, [selectedTab.value, profileTotalDomains, totalListings, totalGraceDomains, totalWatchlistDomains, totalExpiredDomains])

  const content = (
    <div className='z-0 flex w-full flex-col'>
      {selectedTab.value === 'watchlist' && <SetEmailReminder className='rounded-none' />}
      <Domains
        domains={domains}
        loadingRowCount={30}
        filtersOpen={selectors.filters.open}
        paddingBottom={selectedTab.value === 'watchlist' ? '320px' : '160px'}
        noResults={!domainsLoading && domains?.length === 0}
        isLoading={domainsLoading}
        hasMoreDomains={hasMoreDomains}
        fetchMoreDomains={() => {
          if (hasMoreDomains && !domainsLoading) {
            fetchMoreDomains()
          }
        }}
        displayedDetails={displayedDetails}
        showWatchlist={selectedTab.value === 'watchlist'}
      />
    </div>
  )

  return (
    <SelectAllProvider
      ownerAddress={user}
      loadedDomains={domains}
      totalCount={totalCount}
      filters={selectors.filters}
      searchTerm={debouncedSearch}
      isWatchlist={selectedTab.value === 'watchlist'}
      isAuthenticated={authStatus === 'authenticated'}
    >
      {content}
      <BulkSelect isMyProfile={isMyProfile} pageType='profile' />
    </SelectAllProvider>
  )
}

export default DomainPanel
