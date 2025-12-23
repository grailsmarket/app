'use client'

import React, { useMemo } from 'react'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
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

interface Props {
  user: Address | undefined
}

const DomainPanel: React.FC<Props> = ({ user }) => {
  const dispatch = useAppDispatch()
  const { selectors, actions } = useFilterRouter()
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains } = useDomains(user)
  const { isSelecting } = useAppSelector(selectBulkSelect)
  const { selectedTab } = useAppSelector(selectUserProfile)

  const displayedDetails = useMemo(() => {
    switch (selectedTab.value) {
      case 'domains':
        return PORTFOLIO_MY_DOMAINS_DISPLAYED_COLUMNS
      case 'listings':
        return PORTFOLIO_MY_LISTINGS_DISPLAYED_COLUMNS
      case 'watchlist':
        return PORTFOLIO_WATCHLIST_DISPLAYED_COLUMNS
    }
  }, [selectedTab.value])

  return (
    <div className='sm:px-md px-sm flex w-full flex-col gap-2'>
      <div className='md:p-md lg:px-lg flex w-full items-center justify-between gap-2'>
        <div className='px-sm flex w-auto items-center gap-2 md:p-0'>
          <button
            className='border-foreground flex h-9 w-9 cursor-pointer items-center justify-center rounded-sm border opacity-70 transition-opacity hover:opacity-100 md:h-10 md:w-10 lg:hidden'
            onClick={() => dispatch(actions.setFiltersOpen(true))}
          >
            <Image src={FilterIcon} alt='Filter' width={16} height={16} />
          </button>
          <div className='w-ful group border-tertiary flex h-9 items-center justify-between rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none focus-within:border-white/80! hover:border-white/40 md:h-10'>
            <input
              type='text'
              placeholder='Search'
              value={selectors.filters.search}
              onChange={(e) => dispatch(actions.setSearch(e.target.value))}
              className='w-[200px] bg-transparent text-lg outline-none lg:w-[260px]'
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
        </div>
        <ViewSelector />
      </div>
      <Domains
        domains={domains}
        loadingRowCount={20}
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
        isBulkSelecting={(selectedTab.value === 'domains' || selectedTab.value === 'listings') && isSelecting}
      />
    </div>
  )
}

export default DomainPanel
