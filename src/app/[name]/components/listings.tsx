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
import {
  setMakeListingModalDomains,
  setMakeListingModalOpen,
  setMakeListingModalPreviousListings,
} from '@/state/reducers/modals/makeListingModal'
import { setCancelListingModalListings, setCancelListingModalOpen } from '@/state/reducers/modals/cancelListingModal'
import { setBuyNowModalListing, setBuyNowModalDomain, setBuyNowModalOpen } from '@/state/reducers/modals/buyNowModal'
import {
  setShareModalOpen,
  setShareModalType,
  setShareModalListing,
  setShareModalDomainInfo,
} from '@/state/reducers/modals/shareModal'
import ShareIconWhite from 'public/icons/image.svg'
import Tooltip from '@/components/ui/tooltip'
import { fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import { useQuery } from '@tanstack/react-query'
import { beautifyName } from '@/lib/ens'
import Link from 'next/link'

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
  // const grailsListings = listings.filter((listing) => listing.source === 'grails')

  const openMakeListingModal = () => {
    if (!domain) return
    dispatch(setMakeListingModalDomains([domain]))
    dispatch(setMakeListingModalPreviousListings([]))
    dispatch(setMakeListingModalOpen(true))

    // if (grailsListings.length > 0) {
    //   dispatch(setMakeListingModalPreviousListing(grailsListings[0]))
    // } else {
    //   dispatch(setMakeListingModalPreviousListing(null))
    // }
  }

  return (
    <div className='p-lg lg:p-xl sm:border-tertiary bg-secondary flex w-full flex-col gap-4 sm:rounded-lg sm:border-2'>
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
          <DisplayedListing key={listing.id} listing={listing} isMyDomain={isMyDomain} domain={domain} />
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

interface DisplayedListingProps {
  listing: DomainListingType
  isMyDomain: boolean
  domain?: MarketplaceDomainType
}

const DisplayedListing: React.FC<DisplayedListingProps> = ({ listing, isMyDomain, domain }) => {
  const { data: brokerAccount } = useQuery({
    queryKey: ['brokerAccount', listing.broker_address],
    queryFn: async () => {
      if (!listing.broker_address) return null
      const response = await fetchAccount(listing.broker_address)
      return response
    },
    enabled: !!listing.broker_address,
  })

  return (
    <div className='flex flex-row items-center justify-between gap-2'>
      <div className='flex flex-row items-center gap-2 sm:gap-4'>
        <Image
          src={SOURCE_ICONS[listing.source as keyof typeof SOURCE_ICONS]}
          width={32}
          height={32}
          alt={listing.source}
          className='h-auto w-7 sm:w-8'
        />
        <div className='flex flex-col gap-1'>
          <div className='flex flex-row items-center gap-2'>
            <Price
              price={listing.price}
              currencyAddress={listing.currency_address}
              iconSize='22px'
              fontSize='text-2xl sm:text-2xl pt-[3px] font-semibold'
            />
            {listing.broker_address && listing.broker_fee_bps && (
              <Tooltip
                label={`${brokerAccount?.ens.name ? beautifyName(brokerAccount?.ens?.name) : truncateAddress(listing.broker_address)} - ${listing.broker_fee_bps / 100}%`}
                position='top'
                align='left'
              >
                <Link
                  href={`/profile/${listing.broker_address}?tab=broker`}
                  className='bg-primary/20 text-primary hover:bg-primary/30 rounded-md px-2 py-1 text-xs font-semibold transition-colors'
                >
                  Brokered
                </Link>
              </Tooltip>
            )}
          </div>
          <p className='sm:text-md text-neutral text-sm'>{formatExpiryDate(listing.expires_at)}</p>
        </div>
      </div>
      <ActionButtons listing={listing} isMyDomain={isMyDomain} domain={domain} />
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
  const { onSelect: addToCart } = useCartDomains()

  const openEditListingModal = () => {
    if (!domain) return
    dispatch(setMakeListingModalDomains([domain]))
    dispatch(setMakeListingModalPreviousListings([listing]))
    dispatch(setMakeListingModalOpen(true))
  }

  const openCancelListingModal = () => {
    if (!domain) return
    dispatch(
      setCancelListingModalListings([
        {
          id: listing.id,
          name: domain?.name,
          price: listing.price,
          currency: listing.currency_address,
          expires: listing.expires_at,
          source: listing.source,
        },
      ])
    )
    dispatch(setMakeListingModalPreviousListings([]))
    dispatch(setCancelListingModalOpen(true))
  }

  const openBuyNowModal = () => {
    if (!domain) return
    dispatch(setBuyNowModalDomain(domain))
    dispatch(setBuyNowModalListing(listing))
    dispatch(setBuyNowModalOpen(true))
  }

  const openShareModal = () => {
    if (!domain) return
    dispatch(setShareModalType('listing'))
    dispatch(setShareModalListing(listing))
    dispatch(
      setShareModalDomainInfo({
        name: domain.name,
        ownerAddress: domain.owner,
        categories: domain.clubs,
      })
    )
    dispatch(setShareModalOpen(true))
  }

  if (isMyDomain) {
    return (
      <div className='flex flex-row items-center gap-2'>
        <SecondaryButton onClick={openEditListingModal}>Edit</SecondaryButton>
        <SecondaryButton onClick={openCancelListingModal}>Cancel</SecondaryButton>
        <SecondaryButton
          onClick={openShareModal}
          className='flex min-h-9 min-w-9 items-center justify-center p-0! md:min-h-10! md:min-w-10!'
        >
          <Image src={ShareIconWhite} width={24} height={24} alt='Share' />
        </SecondaryButton>
      </div>
    )
  }

  return (
    <div className='flex flex-row items-center gap-2'>
      <PrimaryButton onClick={openBuyNowModal}>Buy<span className='hidden sm:inline'> Now</span></PrimaryButton>
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (domain) addToCart(e, domain)
        }}
        className='hidden sm:block'
      >
        <CartIcon
          domain={domain}
          hasBorder={true}
          className='flex min-h-9 min-w-9 cursor-pointer items-center justify-center rounded-sm transition-colors md:min-h-10! md:min-w-10!'
        />
      </button>
      <SecondaryButton
        onClick={openShareModal}
        className='flex min-h-9 min-w-9 items-center justify-center p-0! md:min-h-10! md:min-w-10!'
      >
        <Image src={ShareIconWhite} width={24} height={24} alt='Share' />
      </SecondaryButton>
    </div>
  )
}

export default Listings
