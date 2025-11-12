import React from 'react'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import Tooltip from '@/components/ui/tooltip'
import { MarketplaceDomainType } from '@/types/domains'
import { REGISTERED, GRACE_PERIOD } from '@/constants/domains/registrationStatuses'
import { cn } from '@/utils/tailwind'
import Actions from './actions'
import Link from 'next/link'
import NameImage from '@/components/ui/nameImage'
import Price from '@/components/ui/price'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'

interface CardProps {
  domain: MarketplaceDomainType
  className?: string
  isFirstInRow?: boolean
  watchlistId?: number | undefined
  isBulkRenewing?: boolean
}

const Card: React.FC<CardProps> = ({ domain, className, isFirstInRow, watchlistId, isBulkRenewing }) => {
  const { address } = useAccount()
  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const canAddToCart = !(registrationStatus === GRACE_PERIOD || address?.toLowerCase() === domain.owner?.toLowerCase())
  const domainListing = domain.listings[0]

  return (
    <Link
      href={`/${domain.name}`}
      className={cn(
        'group bg-secondary flex h-full w-full cursor-pointer flex-col rounded-sm opacity-80 transition hover:opacity-100',
        !domainIsValid && 'pointer-events-none opacity-40',
        className
      )}
    >
      <div className='xs:max-h-[240px] relative flex max-h-[340px] w-full flex-col justify-between'>
        <NameImage
          name={domain.name}
          tokenId={domain.token_id}
          expiryDate={domain.expiry_date}
          className='h-full w-full rounded-t-sm object-cover'
        />
        {!domainIsValid && (
          <div className='absolute top-4 right-4 z-10'>
            <Tooltip
              position='bottom'
              label='Name contains invalid character(s)'
              align={isFirstInRow ? 'left' : 'right'}
            >
              <p className='pl-[6px]'>⚠️</p>
            </Tooltip>
          </div>
        )}
      </div>
      <div className='p-lg flex w-full flex-1 flex-col justify-between gap-1'>
        <div className='flex w-full flex-col'>
          {registrationStatus !== GRACE_PERIOD &&
            (registrationStatus === REGISTERED ? (
              domainListing?.price ? (
                <div className='flex items-center gap-1'>
                  <Price
                    price={domainListing.price}
                    currencyAddress={domainListing.currency_address}
                    iconSize='16px'
                    fontSize='text-lg font-semibold'
                  />
                </div>
              ) : (
                <p className='text-md leading-[18px] font-bold'>Unlisted</p>
              )
            ) : null)}
          {domain.last_sale_price ? (
            <div className='mt-0.5 flex items-center gap-[6px]'>
              <p className='text-light-400 truncate text-sm leading-[18px] font-medium'>Last sale:</p>
              <div className='flex items-center gap-1'>
                <Price
                  price={domain.last_sale_price}
                  currencyAddress={domain.last_sale_currency as Address}
                  iconSize='16px'
                  fontSize='text-md'
                />
              </div>
            </div>
          ) : (
            <p className='text-md text-neutral truncate font-semibold'>
              {domain.clubs?.map((club) => CATEGORY_LABELS[club as keyof typeof CATEGORY_LABELS]).join(', ')}
            </p>
          )}
        </div>
        <div className='flex justify-between'>
          <Actions
            domain={domain}
            registrationStatus={registrationStatus}
            canAddToCart={canAddToCart}
            isFirstInRow={isFirstInRow}
            watchlistId={watchlistId}
            isBulkRenewing={isBulkRenewing}
          />
        </div>
      </div>
    </Link>
  )
}

export default Card
