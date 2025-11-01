import React, { useMemo, useState } from 'react'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'
import Image from 'next/image'
import LoadingCell from '@/components/ui/loadingCell'
import { SOURCE_ICONS } from '@/constants/domains/sources'
import Price from '@/components/ui/price'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import PrimaryButton from '@/components/ui/buttons/primary'
import CartIcon from '@/components/domains/table/components/CartIcon'
import useCartDomains from '@/hooks/useCartDomains'
import { useAccount } from 'wagmi'
import { useAppDispatch } from '@/state/hooks'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { setMakeListingModalDomain, setMakeListingModalOpen } from '@/state/reducers/modals/makeListingModal'
import { setCancelListingModalListing, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'
import { setBuyNowModalListing, setBuyNowModalDomain, setBuyNowModalOpen } from '@/state/reducers/modals/buyNowModal'

interface ListingsProps {
  domain?: MarketplaceDomainType
  listings: DomainListingType[]
  listingsLoading: boolean
}

const Listings: React.FC<ListingsProps> = ({ domain, listings, listingsLoading }) => {
  const [viewAll, setViewAll] = useState(false)
  const dispatch = useAppDispatch()
  const { address: userAddress } = useAccount()
  const showViewAllButton = listings.length > 2
  const displayedListings = viewAll ? listings : listings.slice(0, 2)
  const isMyDomain = useMemo(
    () => domain?.owner?.toLowerCase() === userAddress?.toLowerCase(),
    [domain?.owner, userAddress]
  )

  const openMakeListingModal = () => {
    if (!domain) return
    dispatch(setMakeListingModalOpen(true))
    dispatch(setMakeListingModalDomain(domain))
  }

  return (
    <div className='p-lg lg:p-xl border-primary bg-secondary flex w-full flex-col gap-4 rounded-lg border-2'>
      <div className='flex w-full items-center justify-between'>
        <h3 className='font-sedan-sc text-3xl'>Listings</h3>
        {isMyDomain && (
          <PrimaryButton onClick={openMakeListingModal}>
            <p>Add Listing +</p>
          </PrimaryButton>
        )}
      </div>
      {listingsLoading ? (
        <LoadingCell height='60px' width='100%' />
      ) : (
        displayedListings.map((listing) => (
          <div key={listing.id} className='flex flex-row items-center justify-between gap-2'>
            <div className='flex flex-row items-center gap-4'>
              <Image
                src={SOURCE_ICONS[listing.source as keyof typeof SOURCE_ICONS]}
                width={32}
                height={32}
                alt={listing.source}
              />
              <div className='flex flex-row items-center gap-2'>
                <Price
                  price={listing.price}
                  currencyAddress={listing.currency_address}
                  iconSize='24px'
                  fontSize='text-2xl pt-[3px] font-semibold'
                />
              </div>
            </div>
            <div>{formatExpiryDate(listing.expires_at)}</div>
            <ActionButtons listing={listing} isMyDomain={isMyDomain} domain={domain} />
          </div>
        ))
      )}
      {!listingsLoading && listings.length === 0 && (
        <div className='p-2xl flex w-full flex-row items-center justify-center gap-2'>
          <p className='text-neutral text-lg'>No listings found</p>
        </div>
      )}
      {showViewAllButton && (
        <button onClick={() => setViewAll(!viewAll)} className='text-light-600 text-sm'>
          {viewAll ? 'View Less' : 'View All'}
        </button>
      )}
    </div>
  )
}

interface ActionButtonsProps {
  listing: DomainListingType
  isMyDomain: boolean
  domain?: MarketplaceDomainType
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ listing, isMyDomain, domain }) => {
  const dispatch = useAppDispatch()
  const { toggleCart: toggleCartDomains } = useCartDomains()

  const openEditListingModal = () => {
    if (!domain) return
    dispatch(setMakeListingModalDomain(domain))
    dispatch(setMakeListingModalOpen(true))
  }

  const openCancelListingModal = () => {
    if (!domain) return
    dispatch(
      setCancelListingModalListing({
        id: listing.id,
        name: domain?.name,
        price: listing.price,
        currency: listing.currency_address,
        expires: listing.expires_at,
      })
    )
    dispatch(setCancelListingModalOpen(true))
  }

  const openBuyNowModal = () => {
    if (!domain) return
    dispatch(setBuyNowModalDomain(domain))
    dispatch(setBuyNowModalListing(listing))
    dispatch(setBuyNowModalOpen(true))
  }

  if (isMyDomain) {
    return (
      <div className='flex flex-row items-center gap-2'>
        <SecondaryButton onClick={openEditListingModal}>Edit</SecondaryButton>
        <SecondaryButton onClick={openCancelListingModal}>Cancel</SecondaryButton>
      </div>
    )
  }

  return (
    <div className='flex flex-row items-center gap-2'>
      <PrimaryButton onClick={openBuyNowModal}>Buy Now</PrimaryButton>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (domain) toggleCartDomains(domain, domain?.expiry_date)
        }}
      >
        <CartIcon
          domain={domain}
          hasBorder={true}
          className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-sm transition-colors'
        />
      </button>
    </div>
  )
}

export default Listings
