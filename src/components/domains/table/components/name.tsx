import Tooltip from '@/components/ui/tooltip'
import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { GRACE_PERIOD, REGISTERABLE_STATUSES } from '@/constants/domains/registrationStatuses'
import { MarketplaceDomainType } from '@/types/domains'
import { RegistrationStatus } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React, { useMemo } from 'react'
import { beautifyName } from '@/lib/ens'
import NameImage from '@/components/ui/nameImage'
import NameVersionBadge from '@/components/ui/nameVersionBadge'
import Image from 'next/image'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { localizeNumber } from '@/utils/localizeNumber'

const RANKED_CATEGORIES = ['prepunk', 'short_name_auction']

const formatCategoryName = (category: string) =>
  category
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

interface NameProps {
  domain: MarketplaceDomainType
  registrationStatus: RegistrationStatus
  domainIsValid: boolean
  columnCount: number
}

const Name: React.FC<NameProps> = ({ domain, registrationStatus, domainIsValid, columnCount }) => {
  const displayedCategory = useMemo(() => {
    const first = domain.clubs?.[0]
    if (!first) return null

    const isRankClub = RANKED_CATEGORIES.find((category) => first.includes(category))
    const clubRank = isRankClub ? domain.club_ranks?.find((rank) => rank.club === first)?.rank : null

    return {
      name: first,
      rank: clubRank,
    }
  }, [])
  const remainingCategories = domain.clubs?.length - 1

  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['domain'].getWidth(columnCount))}>
      <div className='flex h-13.5 w-full max-w-full flex-row items-center'>
        <div className='flex min-w-0 flex-row items-center justify-start gap-2 pr-2'>
          <NameImage
            name={domain.name}
            version={domain.version}
            tokenId={domain.token_id}
            expiryDate={domain.expiry_date}
            registrationStatus={domain.registration_status}
            className='pointer-events-none aspect-square h-10.5 min-h-10.5 w-10.5 min-w-10.5 rounded-sm'
          />
          <div className='flex min-w-0 flex-col gap-0.75'>
            <div className='flex min-w-0 items-center gap-1.5'>
              <p
                className={cn(
                  'truncate text-[13px] leading-4.5 font-bold',
                  registrationStatus === GRACE_PERIOD ? 'text-grace' : 'text-foreground'
                )}
              >
                {beautifyName(domain.name)}
              </p>
              {!REGISTERABLE_STATUSES.includes(registrationStatus) && <NameVersionBadge version={domain.version} />}
              {domain.compromised && (
                <div className='pointer-events-auto shrink-0'>
                  <Tooltip
                    position='right'
                    label='Reported stolen — only the original owner can trade it'
                    align='center'
                  >
                    <p className='text-xs'>🚨</p>
                  </Tooltip>
                </div>
              )}
              {!domainIsValid && (
                <div className='pointer-events-auto shrink-0'>
                  <Tooltip position='right' label='Name contains invalid character(s)' align='center'>
                    <p className='text-xs'>⚠️</p>
                  </Tooltip>
                </div>
              )}
            </div>
            <div className='text-neutral flex w-fit max-w-full flex-row items-center gap-1 truncate text-sm font-semibold @[40rem]/app:gap-1.5'>
              {displayedCategory && (
                <div
                  key={displayedCategory.name}
                  className='flex min-w-fit flex-row items-center gap-0.5 @[40rem]/app:gap-1'
                >
                  <Image
                    src={getCategoryDetails(displayedCategory.name).avatar}
                    alt={displayedCategory.name}
                    width={16}
                    height={16}
                    className='rounded-full'
                  />
                  <p>{formatCategoryName(displayedCategory.name)}</p>
                  {displayedCategory.rank ? <p>#{localizeNumber(displayedCategory.rank)}</p> : null}
                </div>
              )}
              {remainingCategories > 0 && <p>+{remainingCategories}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Name
