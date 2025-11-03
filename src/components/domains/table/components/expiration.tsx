import React from 'react'
import { cn } from '@/utils/tailwind'
import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { UNREGISTERED } from '@/constants/domains/registrationStatuses'

interface ExpirationProps {
  domain: MarketplaceDomainType
  columnCount: number
  registrationStatus: RegistrationStatus
}

const Expiration: React.FC<ExpirationProps> = ({ domain, columnCount, registrationStatus }) => {
  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['expires'].getWidth(columnCount))}>
      {domain.expiry_date && registrationStatus !== UNREGISTERED && (
        <p className='text-light-600 text-md font-bold'>{formatExpiryDate(domain.expiry_date)}</p>
      )}
    </div>
  )
}

export default Expiration
