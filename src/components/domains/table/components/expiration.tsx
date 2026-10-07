import React from 'react'
import { cn } from '@/utils/tailwind'
import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType, RegistrationStatus } from '@/types/domains'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { GRACE_PERIOD, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { useExpiryCountdown } from '@/hooks/useExpiryCountdown'
import { getGraceEnd } from '@/utils/getRegistrationStatus'
import Tooltip from '@/components/ui/tooltip'

interface ExpirationProps {
  domain: MarketplaceDomainType
  columnCount: number
  registrationStatus: RegistrationStatus
}

const Expiration: React.FC<ExpirationProps> = ({ domain, columnCount, registrationStatus }) => {
  const countdownType = registrationStatus === GRACE_PERIOD ? 'grace' : null
  const { timeLeftString } = useExpiryCountdown(domain.expiry_date, countdownType, domain.ens_version)

  if (registrationStatus === GRACE_PERIOD) {
    return (
      <div className={cn(ALL_MARKETPLACE_COLUMNS['expires'].getWidth(columnCount), 'text-md flex flex-col gap-px')}>
        <Tooltip
          label={`Ends ${formatExpiryDate(getGraceEnd(domain.expiry_date, domain.ens_version), { includeTime: true, dateDivider: '/' })}`}
          align='left'
          position='top'
        >
          <p className='text-md text-grace font-medium'>Grace {timeLeftString ? `(${timeLeftString})` : ''}</p>
        </Tooltip>
        {domain.expiry_date && (
          <p className='text-md font-semibold'>
            <span className='hidden @[26.25rem]/app:inline'>Expiry</span>{' '}
            {formatExpiryDate(domain.expiry_date, { includeTime: false, dateDivider: '/' })}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['expires'].getWidth(columnCount))}>
      {domain.expiry_date && registrationStatus !== UNREGISTERED && (
        <p className='text-light-600 text-md font-bold'>{formatExpiryDate(domain.expiry_date)}</p>
      )}
    </div>
  )
}

export default Expiration
