import React, { useState } from 'react'
import { DomainOfferType } from '@/types/domains'
import Image from 'next/image'
import { LoadingCell } from 'ethereum-identity-kit'
import { SOURCE_ICONS } from '@/constants/domains/sources'
import Price from '@/components/ui/price'
import User from '@/components/ui/user'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'

interface OffersProps {
  offers: DomainOfferType[]
  offersLoading: boolean
}

const Offers: React.FC<OffersProps> = ({ offers, offersLoading }) => {
  const [viewAll, setViewAll] = useState(false)
  const showViewAllButton = offers.length > 2
  const displayedOffers = viewAll ? offers : offers.slice(0, 2)

  return (
    <div className='flex w-full flex-col gap-4 p-xl rounded-lg border-2 border-primary bg-secondary'>
      <h3 className='text-3xl font-sedan-sc'>Offers</h3>
      {offersLoading ? <LoadingCell height='60px' width='100%' /> : displayedOffers.sort((a, b) => Number(b.offer_amount_wei) - Number(a.offer_amount_wei)).map((offer) => (
        <div key={offer.id} className='flex flex-row items-center justify-between gap-2'>
          <div className='flex flex-row items-center gap-4'>
            <div className='flex flex-row items-center gap-2'>
              <Image src={SOURCE_ICONS[offer.source as keyof typeof SOURCE_ICONS]} width={32} height={32} alt={offer.source} />
              {/* <p>{SOURCE_LABELS[offer.source as keyof typeof SOURCE_LABELS]}</p> */}
            </div>
            <div className='flex flex-row items-center gap-2'>
              <Price price={offer.offer_amount_wei} asset='ETH' ethSize='24px' />
            </div>
          </div>
          <div className='flex flex-row items-center gap-2'>
            <p className='break-words'>{formatExpiryDate(offer.expires_at)}</p>
          </div>
          <User address={offer.buyer_address} />
        </div>
      ))}
      {!offersLoading && offers.length === 0 && <div className='flex w-full justify-center p-2xl flex-row items-center gap-2'>
        <p className='text-neutral text-lg'>No offers found</p>
      </div>}
      {showViewAllButton && <button onClick={() => setViewAll(!viewAll)} className='text-sm text-light-600'>
        {viewAll ? 'View Less' : 'View All'}
      </button>}
    </div>
  )
}

export default Offers
