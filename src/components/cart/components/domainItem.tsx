import Price from '@/components/ui/price'
import { MarketplaceDomainType } from '@/types/domains'
import React from 'react'
import ActionButtons from './actionButtons'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { beautifyName } from '@/lib/ens'
import { Trash } from 'ethereum-identity-kit'
import useModifyCart from '@/hooks/useModifyCart'
import { REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import Link from 'next/link'
import NameImage from '@/components/ui/nameImage'
import { useAppSelector } from '@/state/hooks'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'
import { cn } from '@/utils/tailwind'

interface DomainItemProps {
  domain: MarketplaceDomainType
}

const DomainItem: React.FC<DomainItemProps> = ({ domain }) => {
  const { modifyCart } = useModifyCart()
  const { modifyingCartTokenIds } = useAppSelector(selectMarketplaceDomains)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const isRegistered = registrationStatus === REGISTERED
  const hasListing = isRegistered && domain.listings[0]

  if (modifyingCartTokenIds.includes(domain.token_id)) return null

  return (
    <div className='flex w-full flex-row items-center gap-1 justify-between'>
      <Link
        href={`/${domain.name}`}
        className={cn('flex flex-row items-center gap-2 transition-all duration-300 hover:opacity-70', hasListing ? 'w-[40%]' : 'w-[70%] md:w-[40%]')}>
        <NameImage
          name={domain.name}
          tokenId={domain.token_id}
          expiryDate={domain.expiry_date}
          className='h-8 w-8 rounded-sm sm:h-9 sm:w-9'
        />
        <p className='text-md line-clamp-2 truncate font-bold sm:text-lg' style={{ maxWidth: 'calc(100% - 40px)' }}>{beautifyName(domain.name)}</p>
      </Link>
      <div className={cn('min-w-16 flex-row items-center justify-end gap-2 w-[20%]', hasListing ? 'w-[20%]' : 'hidden md:flex md:w-[20%]')}>
        {hasListing && (
          <Price
            price={domain.listings[0].price}
            currencyAddress={domain.listings[0].currency_address}
            iconSize='16px'
            tooltipPosition='top'
            alignTooltip='left'
          />
        )}
      </div>
      <div className='flex w-fit flex-row items-center justify-end gap-2 sm:w-[30%]'>
        <ActionButtons domain={domain} registrationStatus={registrationStatus} />
        <Trash
          className='text-neutral hover:text-foreground border-neutral hover:border-foreground box-border h-[36px] md:h-[38px] w-[36px] md:w-[38px] cursor-pointer rounded-sm border p-2.5 transition-all duration-300'
          onClick={() =>
            modifyCart({
              domain,
              inCart: true,
              cartType: registrationStatus === UNREGISTERED ? 'registrations' : 'sales',
            })
          }
        />
      </div>
    </div>
  )
}

export default DomainItem
