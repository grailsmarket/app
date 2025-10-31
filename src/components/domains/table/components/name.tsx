import Tooltip from '@/components/ui/tooltip'
import { DOMAIN_IMAGE_URL } from '@/constants'
import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { PREMIUM } from '@/constants/domains/registrationStatuses'
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
      <div className='flex h-[36px] flex-col justify-center'>
        <div className='flex w-full max-w-5/6 flex-row items-center justify-start gap-2'>
          <Image
            src={`${DOMAIN_IMAGE_URL}/${numberToHex(domain.token_id)}/image`}
            unoptimized
            alt='icon'
            width={30}
            height={30}
            className='h-8 w-8 rounded-sm'
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <p
            className={`text-md truncate leading-[18px] font-bold ${
              registrationStatus === PREMIUM ? 'text-purple' : 'text-light-100'
            }`}
          >
            {beautifyName(domain.name)}
          </p>
          {!domainIsValid && (
            <Tooltip position='right' label='Name contains invalid character(s)' align='center'>
              <p className='pl-2 text-xs'>⚠️</p>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  )
}

export default Name
