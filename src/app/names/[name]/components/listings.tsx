import React from 'react'
import { DomainListingType } from '@/types/domains'
import { formatPrice } from '@/utils/formatPrice'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import Image from 'next/image'
import ethGray from 'public/icons/eth-gray.svg'

interface ListingsProps {
  name: string
  listings: DomainListingType[]
  nameDetailsIsLoading: boolean
}

const Listings: React.FC<ListingsProps> = ({ name, listings, nameDetailsIsLoading }) => {

  return (
    <div className='flex w-full flex-col p-xl rounded-lg border-2 border-primary bg-secondary'>
      {listings.map((listing) => (
        <div key={listing.id} className='flex flex-row items-center gap-2'>
          <div className='flex flex-row items-center gap-2'>
            <Image src={ethGray} alt='ETH' className='h-[14px] w-auto' />
            <p>{formatEtherPrice(listing.price)}</p>
          </div>
          <div className='flex flex-row items-center gap-2'>
            <p>{listing.source}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default Listings
