import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { REGISTERED } from '@/constants/domains/registrationStatuses'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import { cn } from '@/utils/tailwind'
import Image from 'next/image'
import React from 'react'
import ethGray from 'public/icons/eth-gray.svg'

interface ListPriceProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
  columnCount: number
}

const ListPrice: React.FC<ListPriceProps> = ({ domain, registrationStatus, columnCount }) => {
  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['listed_price'].getWidth(columnCount))}>
      <div className="flex">
        {registrationStatus === REGISTERED && domain.price && (
          <Image src={ethGray} alt="ETH" className="h-[14px] w-auto" />
        )}
        <p className="ml-1 truncate text-xs font-medium text-light-600">
          price
          {registrationStatus === REGISTERED &&
            domain.price &&
            formatEtherPrice(domain.price)}
        </p>
      </div>
    </div>
  )
}

export default ListPrice
