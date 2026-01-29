'use client'

import React from 'react'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import Offers from '@/components/offers'
import { useUserContext } from '@/context/user'
import { useOffers } from '../hooks/useOffers'
import { Address } from 'viem'

interface OfferPanelProps {
  user: Address | undefined
}

const OfferPanel: React.FC<OfferPanelProps> = ({ user }) => {
  const { authStatus } = useUserContext()
  const { selectedTab } = useAppSelector(selectUserProfile)
  const { offers, offersLoading, fetchMoreOffers, hasMoreOffers, displayedDetails } = useOffers(user)
  // const { isNavbarVisible } = useNavbar()
  const disconnectMessage = {
    sent_offers: 'Sign in to view your offers.',
    received_offers: 'Sign in to view your received offers.',
  }[selectedTab.value as 'sent_offers' | 'received_offers']

  const noResultMessage = {
    sent_offers: 'No offers found. Try clearing your filters.',
    received_offers: 'No offers found. Try clearing your filters.',
  }[selectedTab.value as 'sent_offers' | 'received_offers']

  return (
    <div className='z-0 flex w-full flex-col'>
      {/* <div
        className={cn(
          'py-md md:py-lg px-md lg:px-lg transition-top bg-background sticky z-50 flex w-full flex-col items-start justify-start gap-2 duration-300 sm:flex-row',
          isNavbarVisible ? 'top-26 md:top-32' : 'top-12 md:top-14'
        )}
      >
        <div className='flex w-full items-center gap-2 sm:w-auto'>
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
              value={selectors.filters.search || ''}
              onChange={(e) => dispatch(actions.setSearch(e.target.value))}
              className='w-full bg-transparent text-lg outline-none sm:w-[200px] lg:w-[260px]'
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
      </div> */}
      <Offers
        offers={offers}
        loadingRowCount={20}
        paddingBottom='120px'
        noResults={!offersLoading && offers?.length === 0}
        noResultsLabel={authStatus === 'unauthenticated' ? disconnectMessage : noResultMessage}
        isLoading={offersLoading}
        hasMoreOffers={hasMoreOffers}
        fetchMoreOffers={fetchMoreOffers}
        columns={displayedDetails}
        currentUserAddress={user}
      />
    </div>
  )
}

export default OfferPanel
