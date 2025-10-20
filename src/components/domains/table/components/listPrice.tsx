import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { REGISTERED } from '@/constants/domains/registrationStatuses'
import { DomainListingType, RegistrationStatus } from '@/types/domains'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import { cn } from '@/utils/tailwind'
import Image from 'next/image'
import React from 'react'
import ethGray from 'public/icons/eth-gray.svg'

interface ListPriceProps {
  listing: DomainListingType
  registrationStatus: RegistrationStatus
  columnCount: number
}

const ListPrice: React.FC<ListPriceProps> = ({ listing, registrationStatus, columnCount }) => {
  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['listed_price'].getWidth(columnCount))}>
      {listing && <div className='flex flex-row items-center gap-0.5!'>
        {registrationStatus === REGISTERED && listing.price && (
          <Image src={ethGray} alt='ETH' className='h-[14px] w-auto' />
        )}
        <p className='text-light-600 truncate text-xs font-medium'>
          {registrationStatus === REGISTERED && listing.price && formatEtherPrice(listing.price)}
        </p>
      </div>}
    </div>
  )
}

export default ListPrice
