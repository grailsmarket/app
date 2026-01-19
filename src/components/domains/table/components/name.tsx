import Tooltip from '@/components/ui/tooltip'
import { ALL_MARKETPLACE_COLUMNS, CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { GRACE_PERIOD } from '@/constants/domains/registrationStatuses'
import { MarketplaceDomainType } from '@/types/domains'
import { RegistrationStatus } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { beautifyName } from '@/lib/ens'
import NameImage from '@/components/ui/nameImage'
import Image from 'next/image'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { useWindowSize } from 'ethereum-identity-kit'

interface NameProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
  domainIsValid: boolean
  columnCount: number
}

const Name: React.FC<NameProps> = ({ domain, registrationStatus, domainIsValid, columnCount }) => {
  const { width } = useWindowSize()
  const maxShownCategories = width && width < 640 ? 1 : 2
  const displayedCategories = domain.clubs?.slice(0, maxShownCategories)
  const remainingCategories =
    domain.clubs?.length && domain.clubs?.length > maxShownCategories ? domain.clubs?.slice(maxShownCategories) : []

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
                'text-md max-w-full truncate leading-[18px] font-bold',
                registrationStatus === GRACE_PERIOD ? 'text-grace' : 'text-foreground'
              )}
            >
              {beautifyName(domain.name)}
            </p>
            <div className='text-md text-neutral flex w-fit max-w-full flex-row items-center gap-1 truncate font-semibold sm:gap-1.5'>
              {displayedCategories?.map((club) => (
                <div key={club} className='flex min-w-fit flex-row items-center gap-0.5 sm:gap-1'>
                  <Image
                    src={getCategoryDetails(club).avatar}
                    alt={club}
                    width={16}
                    height={16}
                    className='rounded-full'
                  />
                  <span>{CATEGORY_LABELS[club as keyof typeof CATEGORY_LABELS]}</span>
                </div>
              ))}
              {remainingCategories?.length > 0 && <p>+{remainingCategories.length}</p>}
            </div>
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
