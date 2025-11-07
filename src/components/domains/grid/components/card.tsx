import React from 'react'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import Tooltip from '@/components/ui/tooltip'
import SaleAsset from '@/components/ui/asset'
import { MarketplaceDomainType } from '@/types/domains'
import { REGISTERED, GRACE_PERIOD } from '@/constants/domains/registrationStatuses'
import { cn } from '@/utils/tailwind'
import Actions from './actions'
import { TOKEN_ADDRESSES } from '@/constants/web3/tokens'
import Link from 'next/link'
import NameImage from '@/components/ui/nameImage'
import Price from '@/components/ui/price'

interface CardProps {
  domain: MarketplaceDomainType
  className?: string
  isFirstInRow?: boolean
}

const Card: React.FC<CardProps> = ({ domain, className, isFirstInRow }) => {
  const { address } = useAccount()
  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const canAddToCart = !(registrationStatus === GRACE_PERIOD || address?.toLowerCase() === domain.owner?.toLowerCase())
  const domainListing = domain.listings[0]

  return (
    <Link
      href={`/${domain.name}`}
      className={cn(
        'group bg-secondary xs:h-[330px] flex h-[440px] w-full cursor-pointer flex-col rounded-sm opacity-70 transition hover:opacity-100',
        className
      )}
    >
      <div className='xs:max-h-[250px] relative flex max-h-[320px] w-full flex-col justify-between sm:max-h-[240px]'>
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
                    fontSize='text-md'
                  />
                </div>
              ) : (
                <p className='text-md leading-[18px] font-bold'>Unlisted</p>
              )
            ) : (
              <div className='flex items-center gap-1'>
                <p className='text-md leading-[18px] font-bold'>Unregistered</p>
              </div>
            ))}
          {domain.last_sale_price ? (
            <div className='flex items-center gap-[6px]'>
              <p className='text-light-400 truncate text-xs leading-[18px] font-medium'>Last sale:</p>
              <div className='flex items-center gap-1'>
                <SaleAsset
                  currencyAddress={(domain.last_sale_currency as Address) || TOKEN_ADDRESSES.ETH}
                  iconSize='11px'
                  fontSize='text-xs'
                />
                <p className='text-light-150 text-xs'>
                  {domain.last_sale_price ? formatEtherPrice(domain.last_sale_price) : null}
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
        <div className='flex justify-between'>
          <Actions
            domain={domain}
            registrationStatus={registrationStatus}
            canAddToCart={canAddToCart}
            isFirstInRow={isFirstInRow}
          />
        </div>
      </div>
    </Link>
  )
}

export default Card
