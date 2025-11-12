'use client'

import React from 'react'
import { useDomains } from '../hooks/useDomains'
import Domains from '@/components/domains'
import ViewSelector from '@/components/domains/viewSelector'
import FilterIcon from 'public/icons/filter.svg'
import Image from 'next/image'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { useFilterRouter } from '@/hooks/filters/useFilterRouter'
import { useWindowSize } from 'ethereum-identity-kit'
import MagnifyingGlass from 'public/icons/search.svg'
import TabSwitcher from './tabSwitcher'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { useUserContext } from '@/context/user'
import useScrollToBottom from '@/hooks/useScrollToBottom'
import { selectBulkRenewalModal } from '@/state/reducers/modals/bulkRenewalModal'

const DomainPanel = () => {
  const dispatch = useAppDispatch()
  const { authStatus } = useUserContext()
  const { selectors, actions } = useFilterRouter()
  const { width: windowWidth } = useWindowSize()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const { domains, domainsLoading, fetchMoreDomains, hasMoreDomains, displayedDetails } = useDomains()
  const isAtBottom = useScrollToBottom({ threshold: 100 })
  const { canAddDomains } = useAppSelector(selectBulkRenewalModal)

  const disconnectMessage = {
    domains: 'Sign in to view your domains.',
    watchlist: 'Sign in to view your watchlist.',
  }[selectedTab.value as 'domains' | 'watchlist']

  const noResultMessage = {
    domains: 'No names found. Try clearing your filters.',
    watchlist: 'No names found. Try clearing your filters.',
  }[selectedTab.value as 'domains' | 'watchlist']

  return (
    <div
      className='flex flex-col gap-4'
      style={{
        width: windowWidth && windowWidth < 1024 ? '100%' : 'calc(100% - 280px)',
      }}
    >
      <TabSwitcher />
      <div className='px-md flex flex-col gap-4 sm:px-0'>
        <div className='px-sm md:px-md lg:px-lg flex w-full items-center justify-between gap-2'>
          <div className='flex w-auto items-center gap-2'>
            <button
              className='border-foreground flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm border opacity-70 transition-opacity hover:opacity-100 lg:hidden'
              onClick={() => dispatch(actions.setFiltersOpen(true))}
            >
              <Image src={FilterIcon} alt='Filter' width={16} height={16} />
            </button>
            <div className='w-ful group focus-within:border-primary/100! hover:border-primary/70 border-primary/40 p-md flex items-center justify-between rounded-sm border-[2px] bg-transparent px-3 transition-all outline-none'>
              <input
                type='text'
                placeholder='Search'
                value={selectors.filters.search || ''}
                onChange={(e) => dispatch(actions.setSearch(e.target.value))}
                className='w-[200px] bg-transparent text-lg outline-none lg:w-[260px]'
              />
              <Image
                src={MagnifyingGlass}
                alt='Search'
                width={16}
                height={16}
                className='opacity-40 transition-opacity group-focus-within:opacity-100! group-hover:opacity-70'
              />
            </div>
          </div>
          <ViewSelector />
        </div>
        <Domains
          maxHeight={windowWidth && windowWidth < 640 ? 'calc(100vh - 164px)' : 'calc(100vh - 220px)'}
          domains={domains}
          loadingRowCount={20}
          paddingBottom={selectedTab.value === 'watchlist' ? '300px' : '140px'}
          noResults={!domainsLoading && domains?.length === 0}
          noResultsLabel={authStatus === 'unauthenticated' ? disconnectMessage : noResultMessage}
          isLoading={domainsLoading}
          hasMoreDomains={hasMoreDomains}
          fetchMoreDomains={() => {
            if (hasMoreDomains && !domainsLoading) {
              fetchMoreDomains()
            }
          }}
          displayedDetails={displayedDetails}
          scrollEnabled={isAtBottom}
          showWatchlist={selectedTab.value === 'watchlist'}
          isBulkRenewing={selectedTab.value === 'domains' && canAddDomains}
        />
      </div>
    </div>
  )
}

export default DomainPanel
