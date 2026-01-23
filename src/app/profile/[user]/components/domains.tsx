'use client'

import React, { useMemo } from 'react'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import SortDropdown from '@/components/domains/sortDropdown'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { Address, Cross } from 'ethereum-identity-kit'
import MagnifyingGlass from 'public/icons/search.svg'
import { useDomains } from '../hooks/useDomains'
import { selectBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import {
  PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS,
  PORTFOLIO_MY_LISTINGS_DISPLAYED_COLUMNS,
  PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS,
} from '@/constants/domains/marketplaceDomains'
import { cn } from '@/utils/tailwind'
import { useNavbar } from '@/context/navbar'
import { SelectAllProvider } from '@/context/selectAll'
import { useDebounce } from '@/hooks/useDebounce'
import { useUserContext } from '@/context/user'
import { MarketplaceFiltersState } from '@/state/reducers/filters/marketplaceFilters'
import BulkSelect from '@/components/ui/bulkSelect'
import DownloadButton from '@/components/ui/downloadButton'

interface Props {
  user: Address | undefined
  isMyProfile?: boolean
}

const DomainPanel: React.FC<Props> = ({ user, isMyProfile = false }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const {
    domains,
    domainsLoading,
    fetchMoreDomains,
    hasMoreDomains,
    profileTotalDomains,
    totalListings,
    totalGraceDomains,
    totalWatchlistDomains,
  } = useDomains(user)
  const { isSelecting } = useAppSelector(selectBulkSelect)
  const { selectedTab } = useAppSelector(selectUserProfile)
  const { isNavbarVisible } = useNavbar()
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
      default:
        return 0
    }
  }, [selectedTab.value, profileTotalDomains, totalListings, totalGraceDomains, totalWatchlistDomains])

  // Check if bulk select is enabled for this tab
  const isBulkSelectEnabled = isSelecting

  const content = (
    <div className='z-0 flex w-full flex-col'>
      <div
        className={cn(
          'py-md md:py-lg px-sm md:px-md lg:px-lg transition-top bg-background sticky z-50 flex w-full flex-col items-center justify-between gap-2 duration-300 sm:flex-row',
          isNavbarVisible ? 'top-26 md:top-32' : 'top-12 md:top-14'
        )}
      >
        <div className='px-sm flex w-full items-center gap-2 sm:w-fit md:p-0'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-30 transition-opacity hover:opacity-80 md:h-10 md:w-10'
            onClick={() => dispatch(actions.setFiltersOpen(!selectors.filters.open))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='group border-tertiary flex h-9 w-[calc(100%-39px)] items-center justify-between rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/40 sm:w-fit md:h-10'>
            <input
              type='text'
              placeholder='Search'
              value={selectors.filters.search}
              onChange={(e) => dispatch(actions.setSearch(e.target.value))}
              className='w-full bg-transparent text-lg outline-none sm:w-[200px] lg:w-[260px]'
            />
            {selectors.filters.search.length === 0 ? (
              <Image
                src={MagnifyingGlass}
                alt='Search'
                width={16}
                height={16}
                className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
              />
            ) : (
              <Cross
                onClick={() => dispatch(actions.setSearch(''))}
                className='h-4 w-4 cursor-pointer p-0.5 opacity-100 transition-opacity hover:opacity-70'
              />
            )}
          </div>
          <div className='hidden sm:block'>
            <SortDropdown />
          </div>
        </div>
        <div className='px-sm flex w-full items-center justify-between gap-2 sm:w-fit sm:justify-end'>
          <div className='block sm:hidden'>
            <SortDropdown />
          </div>
          <DownloadButton ownerAddress={user} />
          <ViewSelector />
        </div>
      </div>
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
        isBulkSelecting={isBulkSelectEnabled}
      />
    </div>
  )

  return (
    <SelectAllProvider
      ownerAddress={user}
      loadedDomains={domains}
      totalCount={totalCount}
      filters={selectors.filters as MarketplaceFiltersState}
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
