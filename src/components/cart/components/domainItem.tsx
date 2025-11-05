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

interface DomainItemProps {
  domain: MarketplaceDomainType
}

const DomainItem: React.FC<DomainItemProps> = ({ domain }) => {
  const { modifyCart } = useModifyCart()
  const { modifyingCartTokenIds } = useAppSelector(selectMarketplaceDomains)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const isRegistered = registrationStatus === REGISTERED

  if (modifyingCartTokenIds.includes(domain.token_id)) return null

  return (
    <div className='flex w-full flex-row items-center justify-between'>
      <Link
        href={`/${domain.name}`}
        className='flex w-[40%] flex-row items-center gap-2 transition-all duration-300 hover:opacity-70 sm:w-[50%]'
      >
        <NameImage
          name={domain.name}
          tokenId={domain.token_id}
          expiryDate={domain.expiry_date}
          className='h-8 w-8 rounded-sm sm:h-9 sm:w-9'
        />
        <p className='text-md line-clamp-2 font-bold sm:text-lg'>{beautifyName(domain.name)}</p>
      </Link>
      <div className='flex min-w-16 flex-row items-center justify-end gap-2 sm:w-[20%]'>
        {isRegistered && domain.listings[0] && (
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
          className='text-neutral hover:text-foreground border-neutral hover:border-foreground box-border h-[38px] w-[38px] cursor-pointer rounded-sm border p-2.5 transition-all duration-300'
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
