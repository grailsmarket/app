import React, { useState } from 'react'
import { DomainListingType } from '@/types/domains'
import Image from 'next/image'
import LoadingCell from '@/components/ui/loadingCell'
import { SOURCE_ICONS } from '@/constants/domains/sources'
import Price from '@/components/ui/price'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import PrimaryButton from '@/components/ui/buttons/primary'
import CartIcon from '@/components/domains/table/components/CartIcon'

interface ListingsProps {
  name: string
  listings: DomainListingType[]
  listingsLoading: boolean
}

const Listings: React.FC<ListingsProps> = ({ name, listings, listingsLoading }) => {
  const [viewAll, setViewAll] = useState(false)

  const showViewAllButton = listings.length > 2
  const displayedListings = viewAll ? listings : listings.slice(0, 2)

  return (
    <div className='flex w-full flex-col p-xl gap-4 rounded-lg border-2 border-primary bg-secondary'>
      <h3 className='text-3xl font-sedan-sc'>Listings</h3>
      {listingsLoading ? <LoadingCell height='60px' width='100%' /> : displayedListings.map((listing) => (
        <div key={listing.id} className='flex flex-row items-center justify-between gap-2'>
          <div className='flex flex-row items-center gap-4'>
            <Image src={SOURCE_ICONS[listing.source as keyof typeof SOURCE_ICONS]} width={32} height={32} alt={listing.source} />
            <div className='flex flex-row items-center gap-2'>
              <Price price={listing.price} currencyAddress={listing.currency_address} />
            </div>
          </div>
          <div>{formatExpiryDate(listing.expires_at)}</div>
          <div className='flex flex-row items-center gap-2'>
            <PrimaryButton>Buy Now</PrimaryButton>
            <CartIcon name={name} className='flex items-center justify-center h-10 w-10 border-2 cursor-pointer border-foreground/50 hover:border-foreground/100 transition-colors rounded-sm' />
          </div>
        </div>
      ))}
      {!listingsLoading && listings.length === 0 && <div className='flex w-full justify-center p-2xl flex-row items-center gap-2'>
        <p className='text-neutral text-lg'>No listings found</p>
      </div>}
      {showViewAllButton && <button onClick={() => setViewAll(!viewAll)} className='text-sm text-light-600'>
        {viewAll ? 'View Less' : 'View All'}
      </button>}
    </div>
  )
}

export default Listings
