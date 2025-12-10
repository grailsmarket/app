import React from 'react'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import Tooltip from '@/components/ui/tooltip'
import { MarketplaceDomainType } from '@/types/domains'
import { REGISTERED, GRACE_PERIOD, EXPIRED_STATUSES } from '@/constants/domains/registrationStatuses'
import { cn } from '@/utils/tailwind'
import Actions from './actions'
import NameImage from '@/components/ui/nameImage'
import Price from '@/components/ui/price'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { useFilterContext } from '@/context/filters'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectBulkSelect,
  addBulkSelectDomain,
  removeBulkSelectDomain,
  addBulkSelectPreviousListing,
  removeBulkSelectPreviousListing,
} from '@/state/reducers/modals/bulkSelectModal'

interface CardProps {
  domain: MarketplaceDomainType
  className?: string
  isFirstInRow?: boolean
  watchlistId?: number | undefined
  isBulkSelecting?: boolean
}

const Card: React.FC<CardProps> = ({ domain, className, isFirstInRow, watchlistId, isBulkSelecting }) => {
  const { address } = useAccount()
  const dispatch = useAppDispatch()
  const { filterType, portfolioTab } = useFilterContext()
  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const canAddToCart = !(
    EXPIRED_STATUSES.includes(registrationStatus) || address?.toLowerCase() === domain.owner?.toLowerCase()
  )
  const domainListing = domain.listings[0]
  const grailsListings = domain.listings.filter((listing) => listing.source === 'grails')
  const { domains: selectedDomains } = useAppSelector(selectBulkSelect)
  const isSelected = isBulkSelecting && selectedDomains.some((d) => d.name === domain.name)

  return (
    <a
      href={`/${domain.name}`}
      onClick={(e) => {
        if (isBulkSelecting) {
          e.preventDefault()
          e.stopPropagation()

          if (isSelected) {
            dispatch(removeBulkSelectDomain(domain))
            if (grailsListings.length > 0) {
              grailsListings.forEach((listing) => dispatch(removeBulkSelectPreviousListing(listing)))
            }
          } else {
            dispatch(addBulkSelectDomain(domain))
            if (grailsListings.length > 0) {
              grailsListings.forEach((listing) => dispatch(addBulkSelectPreviousListing(listing)))
            }
          }
        }
      }}
      className={cn(
        'group bg-secondary flex h-full w-full cursor-pointer flex-col rounded-sm opacity-100 transition hover:opacity-100 md:opacity-80',
        !domainIsValid && 'pointer-events-none opacity-40',
        isBulkSelecting
          ? isSelected
            ? 'bg-primary/20 hover:bg-foreground/30 opacity-100!'
            : 'hover:bg-primary/10'
          : 'hover:bg-foreground/10',
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
      <div
        className={cn(
          'p-lg flex w-full flex-1 flex-col justify-between gap-1',
          isBulkSelecting && 'pointer-events-none'
        )}
      >
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
            isBulkSelecting={isBulkSelecting}
          />
        </div>
      </div>
    </a>
  )
}

export default Card
