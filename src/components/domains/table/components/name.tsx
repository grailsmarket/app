import Tooltip from '@/components/ui/tooltip'
import { DOMAIN_IMAGE_URL } from '@/constants'
import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { GRACE_PERIOD } from '@/constants/domains/registrationStatuses'
import { MarketplaceDomainType } from '@/types/domains'
import { RegistrationStatus } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import Image from 'next/image'
import React from 'react'
import { numberToHex } from 'viem'
import { beautifyName } from '@/lib/ens'

interface NameProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
  domainIsValid: boolean
  columnCount: number
}

const Name: React.FC<NameProps> = ({ domain, registrationStatus, domainIsValid, columnCount }) => {
  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['domain'].getWidth(columnCount))}>
      <div className='flex h-[36px] flex-row max-w-full items-center'>
        <div className='flex w-full truncate flex-row items-center justify-start gap-2' style={{ maxWidth: domainIsValid ? 'calc(100% - 16px)' : 'calc(100% - 52px)' }}>
          <Image
            src={`${DOMAIN_IMAGE_URL}/${numberToHex(domain.token_id)}/image`}
            unoptimized
            alt='icon'
            width={36}
            height={36}
            className='h-8 w-8 sm:h-[34px] sm:w-[34px] rounded-sm'
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div className='flex flex-col max-w-full gap-px'>
            <p
              className={cn('text-md truncate leading-[18px] font-bold', registrationStatus === GRACE_PERIOD ? 'text-yellow-500' : 'text-light-100')}
            >
              {beautifyName(domain.name)}
            </p>
            {registrationStatus === GRACE_PERIOD ? (
              <p className='text-md text-neutral'>Grace Period</p>
            ) : (
              <p className='text-md truncate font-semibold text-neutral'>{domain.clubs?.join(', ')}</p>
            )}
          </div>
        </div>
        {!domainIsValid && (
          <div>
            <Tooltip position='right' label='Name contains invalid character(s)' align='center'>
              <p className='pl-2 text-xs'>⚠️</p>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}

export default Name
