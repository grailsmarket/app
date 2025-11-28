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
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { useFilterContext } from '@/context/filters'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  removeTransferModalDomain,
  addTransferModalDomain,
  selectTransferModal,
} from '@/state/reducers/modals/transferModal'
import {
  removeBulkRenewalModalDomain,
  addBulkRenewalModalDomain,
  selectBulkRenewalModal,
} from '@/state/reducers/modals/bulkRenewalModal'

interface CardProps {
  domain: MarketplaceDomainType
  className?: string
  isFirstInRow?: boolean
  watchlistId?: number | undefined
  isBulkRenewing?: boolean
  isBulkTransferring?: boolean
}

const Card: React.FC<CardProps> = ({
  domain,
  className,
  isFirstInRow,
  watchlistId,
  isBulkRenewing,
  isBulkTransferring,
}) => {
  const { address } = useAccount()
  const dispatch = useAppDispatch()
  const { filterType, portfolioTab } = useFilterContext()
  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const canAddToCart = !(registrationStatus === GRACE_PERIOD || address?.toLowerCase() === domain.owner?.toLowerCase())
  const domainListing = domain.listings[0]
  const { domains: transferModalDomains } = useAppSelector(selectTransferModal)
  const { domains: bulkRenewalDomains } = useAppSelector(selectBulkRenewalModal)
  const isBulkAction = isBulkRenewing || isBulkTransferring

  return (
    <Link
      href={`/${domain.name}`}
      onClick={(e) => {
        if (isBulkAction) {
          e.preventDefault()
          e.stopPropagation()

          if (isBulkTransferring) {
            const domainItem = {
              name: domain.name,
              tokenId: domain.token_id,
              owner: domain.owner,
              expiry_date: domain.expiry_date,
            }

            if (transferModalDomains.some((d) => d.name === domain.name)) {
              dispatch(removeTransferModalDomain(domainItem))
            } else {
              dispatch(addTransferModalDomain(domainItem))
            }
          } else if (isBulkRenewing) {
            e.preventDefault()
            e.stopPropagation()

            if (bulkRenewalDomains.some((d) => d.name === domain.name)) {
              dispatch(removeBulkRenewalModalDomain(domain))
            } else {
              dispatch(addBulkRenewalModalDomain(domain))
            }
          }
        }
      }}
      className={cn(
        'group bg-secondary flex h-full w-full cursor-pointer flex-col rounded-sm opacity-100 md:opacity-80 transition hover:opacity-100',
        !domainIsValid && 'pointer-events-none opacity-40',
        isBulkAction ? 'hover:bg-primary/10' : 'hover:bg-foreground/10',
        className
      )}
    >
      <div className='xs:max-h-[228px] relative flex max-h-[340px] w-full flex-col justify-between overflow-hidden'>
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
      <div className={cn('p-lg flex w-full flex-1 flex-col justify-between gap-1', isBulkAction && 'pointer-events-none md:pointer-events-auto')}>
        <div className='flex w-full flex-col'>
          {registrationStatus === GRACE_PERIOD ? (
            <p className='text-md truncate font-semibold text-yellow-500'>Grace Period</p>
          ) : registrationStatus === REGISTERED ? (
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
          ) : null}
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
          {portfolioTab === 'domains' && filterType === 'portfolio' && domain.expiry_date && (
            <div className='flex items-center gap-1'>
              <p className='text-md text-neutral truncate font-semibold'>
                Expiry: {formatExpiryDate(domain.expiry_date, { includeTime: false, dateDivider: '/' })}
              </p>
            </div>
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
            isBulkTransferring={isBulkTransferring}
          />
        </div>
      </div>
    </Link>
  )
}

export default Card
