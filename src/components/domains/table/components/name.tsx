import Tooltip from '@/components/ui/tooltip'
import { ALL_MARKETPLACE_COLUMNS, CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { GRACE_PERIOD } from '@/constants/domains/registrationStatuses'
import { MarketplaceDomainType } from '@/types/domains'
import { RegistrationStatus } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { beautifyName } from '@/lib/ens'
import NameImage from '@/components/ui/nameImage'
import { CATEGORY_IMAGES } from '@/app/categories/[category]/components/categoryDetails'
import Image from 'next/image'

interface NameProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
  domainIsValid: boolean
  columnCount: number
}

const Name: React.FC<NameProps> = ({ domain, registrationStatus, domainIsValid, columnCount }) => {
  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['domain'].getWidth(columnCount))}>
      <div className='flex h-[36px] w-full max-w-full flex-row items-center'>
        <div
          className='flex flex-row items-center justify-start gap-2 truncate'
          style={{ maxWidth: domainIsValid ? 'calc(100% - 8px)' : 'calc(100% - 12px)' }}
        >
          <NameImage
            name={domain.name}
            tokenId={domain.token_id}
            expiryDate={domain.expiry_date}
            className='h-8 w-8 rounded-sm sm:h-[34px] sm:w-[34px]'
          />
          <div className='flex max-w-full flex-col gap-px truncate'>
            <p
              className={cn(
                'text-md truncate leading-[18px] font-bold',
                registrationStatus === GRACE_PERIOD ? 'text-grace' : 'text-foreground'
              )}
            >
              {beautifyName(domain.name)}
            </p>
            <p className='text-md text-neutral flex max-w-full flex-row items-center gap-2 truncate font-semibold'>
              {domain.clubs?.map((club) => (
                <div key={club} className='flex min-w-fit flex-row items-center gap-1'>
                  <Image
                    src={CATEGORY_IMAGES[club as keyof typeof CATEGORY_IMAGES].avatar}
                    alt={club}
                    width={16}
                    height={16}
                    className='rounded-full'
                  />
                  <p>{CATEGORY_LABELS[club as keyof typeof CATEGORY_LABELS]}</p>
                </div>
              ))}
            </p>
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
