import Price from '@/components/ui/price'
import { DOMAIN_IMAGE_URL } from '@/constants'
import { MarketplaceDomainType } from '@/types/domains'
import Image from 'next/image'
import React from 'react'
import { numberToHex } from 'viem'
import ActionButtons from './actionButtons'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { beautifyName } from '@/lib/ens'
import { Trash } from 'ethereum-identity-kit'
import useModifyCart from '@/hooks/useModifyCart'
import { REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import Link from 'next/link'

interface DomainItemProps {
  domain: MarketplaceDomainType
}

const DomainItem: React.FC<DomainItemProps> = ({ domain }) => {
  const { modifyCart } = useModifyCart()
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const isRegistered = registrationStatus === REGISTERED

  return (
    <div className='flex w-full flex-row items-center justify-between'>
      <Link
        href={`/${domain.name}`}
        className='flex w-[40%] sm:w-[50%] flex-row items-center gap-2 transition-all duration-300 hover:opacity-70'
      >
        <Image
          unoptimized
          src={`${DOMAIN_IMAGE_URL}/${numberToHex(domain.token_id)}/image`}
          alt={domain.name}
          width={36}
          height={36}
          onError={(e) => (e.currentTarget.style.display = 'none')}
          className='rounded-sm h-8 w-8 sm:h-9 sm:w-9'
        />
        <p className='line-clamp-2 text-md sm:text-lg font-bold'>{beautifyName(domain.name)}</p>
      </Link>
      <div className='flex min-w-16 sm:w-[20%] justify-end flex-row items-center gap-2'>
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
      <div className='flex w-fit sm:w-[30%] flex-row items-center justify-end gap-2'>
        <ActionButtons domain={domain} registrationStatus={registrationStatus} />
        <Trash
          className='text-neutral hover:text-foreground border-neutral hover:border-foreground box-border h-[38px] w-[38px] cursor-pointer rounded-sm border p-2.5 transition-all duration-300'
          onClick={() =>
            modifyCart({ domain, inCart: true, basket: registrationStatus === UNREGISTERED ? 'REGISTER' : 'PURCHASE' })
          }
        />
      </div>
    </div>
  )
}

export default DomainItem
