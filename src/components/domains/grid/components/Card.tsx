import React from 'react'
import Image from 'next/image'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'

import useCartDomains from '@/hooks/useCartDomains'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import Tooltip from '@/components/ui/tooltip'
import SaleAsset from '@/components/ui/asset'
import CartIcon from '../../table/components/CartIcon'
import Watchlist from '@/components/ui/watchlist'
import { MarketplaceDomainType } from '@/types/domains'
import { REGISTERED, GRACE_PERIOD, REGISTERABLE_STATUSES } from '@/constants/domains/registrationStatuses'
import { getDomainImage } from '@/utils/getDomainImage'
import { cn } from '@/utils/tailwind'

interface CardProps {
  domain: MarketplaceDomainType
  className?: string
  isLastInRow?: boolean
}

const Card: React.FC<CardProps> = ({ domain, className, isLastInRow }) => {
  const { onSelect } = useCartDomains()
  const { address } = useAccount()

  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const canAddToCart = registrationStatus === GRACE_PERIOD || address?.toLowerCase() === domain.owner?.toLowerCase()

  return (
    <div
      className={cn(
        'group bg-secondary flex h-[440px] w-full cursor-pointer flex-col gap-y-px rounded-sm opacity-70 transition hover:opacity-100 sm:h-[340px]',
        className
      )}
    >
      <div className='relative flex max-h-[340px] w-full flex-col justify-between sm:max-h-[230px]'>
        <Image
          src={getDomainImage(domain.token_id)}
          alt='Domain image'
          unoptimized
          width={200}
          height={200}
          className='h-full w-full rounded-t-sm object-cover'
        />
        {!domainIsValid && (
          <div className='absolute top-4 right-4 z-10'>
            <Tooltip
              position='bottom'
              label='Name contains invalid character(s)'
              align={isLastInRow ? 'left' : 'right'}
            >
              <p className='pl-[6px]'>⚠️</p>
            </Tooltip>
          </div>
        )}
      </div>
      <div className='flex w-full flex-1 flex-col justify-between gap-1'>
        <div className='flex w-full flex-col pt-4 pl-4'>
          {registrationStatus !== GRACE_PERIOD &&
            (registrationStatus === REGISTERED ? (
              domain.price ? (
                <div className='flex items-center gap-1'>
                  <SaleAsset asset='ETH' ethSize='12px' />
                  <p className='text-light-100 truncate text-xs leading-[18px] font-bold'>
                    {domain.price && formatEther(BigInt(domain.price))}
                  </p>
                </div>
              ) : (
                <p className='text-light-150 text-xs leading-[18px] font-bold'>Unlisted</p>
              )
            ) : (
              <div className='flex items-center gap-1'>
                <SaleAsset asset='USDC' fontSize='text-xs' />
                <p className={'text-light-100 truncate text-xs leading-[18px] font-bold'}>
                  {domain.registration_price?.toLocaleString(navigator.language, {
                    maximumFractionDigits: 0,
                  })}
                </p>
              </div>
            ))}
          {domain.last_price ? (
            <div className='flex items-center gap-[6px]'>
              <p className='text-light-400 truncate text-xs leading-[18px] font-medium'>Last sale:</p>
              <div className='flex items-center gap-1'>
                <SaleAsset asset={domain.last_sale_asset || 'ETH'} ethSize='11px' fontSize='text-xs' />
                <p className='text-light-150 text-xs'>
                  {domain.last_price ? formatEtherPrice(domain.last_price) : null}
                </p>
              </div>
            </div>
          ) : (
            <p className='text-light-400 h-[18px] min-w-px truncate text-xs leading-[18px] font-medium'>
              {/* {domain.taxonomies?.map((tax: string, index: number) =>
                index + 1 === domain.taxonomies?.length ? tax : tax + ', ',
              ) || registrationStatus} */}
            </p>
          )}
        </div>
        <div className='pl-lg flex justify-between p-2 pt-0'>
          <button
            disabled={canAddToCart}
            // onClick={(e) => onCheckout(e, domain)}
          >
            {!canAddToCart && (
              <p className='text-primary/80 hover:text-primary text-md cursor-pointer font-bold transition-colors'>
                {REGISTERABLE_STATUSES.includes(registrationStatus as string)
                  ? 'Register'
                  : !domain.price && registrationStatus === 'Registered'
                    ? 'Make Offer'
                    : 'Buy now'}
              </p>
            )}
          </button>
          <div className='flex items-center gap-x-1'>
            <Watchlist domain={domain} />
            <button
              onClick={(e) => {
                e.stopPropagation()
                onSelect(e, domain)
              }}
              disabled={canAddToCart}
              className={cn(
                'cursor-pointer rounded-sm p-1.5 transition-opacity',
                canAddToCart ? 'opacity-0' : 'opacity-100'
              )}
            >
              <CartIcon name={domain.name} size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Card
