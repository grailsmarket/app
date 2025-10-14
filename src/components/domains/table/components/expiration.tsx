import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import Image from 'next/image'
import ethGray from 'public/icons/eth-gray.svg'
import { REGISTERABLE_STATUSES } from '@/constants/domains/registrationStatuses'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'

interface ExpirationProps {
  domain: MarketplaceDomainType
  columnCount: number
  registrationStatus: RegistrationStatus
}

const Expiration: React.FC<ExpirationProps> = ({ domain, columnCount, registrationStatus }) => {
  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['expires'].getWidth(columnCount))}>
      {REGISTERABLE_STATUSES.includes(registrationStatus) && domain.expiry_date && (
        <div className='flex'>
          <Image src={ethGray} alt='ETH' className='h-[14px] w-auto' />
          <p className='text-light-600 ml-1 text-xs font-medium'>{formatExpiryDate(domain.expiry_date)}</p>
        </div>
      )}
    </div>
  )
}

export default Expiration
