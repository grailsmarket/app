import React from 'react'
import { useAccount } from 'wagmi'
import { Address } from 'viem'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import Tooltip from '@/components/ui/tooltip'
import { MarketplaceDomainType } from '@/types/domains'
import {
  REGISTERED,
  GRACE_PERIOD,
  EXPIRED_STATUSES,
  PREMIUM,
  UNREGISTERED,
} from '@/constants/domains/registrationStatuses'
import { cn } from '@/utils/tailwind'
import Actions from './actions'
import NameImage from '@/components/ui/nameImage'
import Price from '@/components/ui/price'
import { CATEGORY_LABELS } from '@/constants/domains/marketplaceDomains'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { formatTimeLeft } from '@/utils/time/formatTimeLeft'
import { useFilterContext } from '@/context/filters'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectBulkSelect,
  addBulkSelectDomain,
  removeBulkSelectDomain,
  addBulkSelectPreviousListing,
  removeBulkSelectPreviousListing,
} from '@/state/reducers/modals/bulkSelectModal'
import Link from 'next/link'
import { normalizeName } from '@/lib/ens'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { convertWeiPrice } from '@/utils/convertWeiPrice'
import useETHPrice from '@/hooks/useETHPrice'
import PremiumPriceOracle from '@/utils/web3/premiumPriceOracle'
import { calculateRegistrationPrice } from '@/utils/calculateRegistrationPrice'
import Watchlist from '@/components/ui/watchlist'

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
  const { ethPrice } = useETHPrice()
  const { filterType } = useFilterContext()
  const { selectedTab: profileTab } = useAppSelector(selectUserProfile)
  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const canAddToCart = !(
    EXPIRED_STATUSES.includes(registrationStatus) || address?.toLowerCase() === domain.owner?.toLowerCase()
  )
  const domainListing = domain.listings[0]
  const grailsListings = domain.listings.filter((listing) => listing.source === 'grails')
  const { domains: selectedDomains } = useAppSelector(selectBulkSelect)
  const isSelected = isBulkSelecting && selectedDomains.some((d) => d.name === domain.name)

  const premiumPriceOracle = domain.expiry_date
    ? new PremiumPriceOracle(new Date(domain.expiry_date).getTime() / 1000)
    : null
  const premiumPrice = premiumPriceOracle
    ? premiumPriceOracle.getOptimalPrecisionPremiumAmount(new Date().getTime() / 1000)
    : 0
  const regPrice = calculateRegistrationPrice(domain.name, ethPrice)

  return (
    <Link
      href={`/${normalizeName(domain.name)}`}
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
      <div className='xs:max-h-[228px] relative flex max-h-[340px] w-full flex-col justify-between'>
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
        {watchlistId && (
          <div
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
            }}
            className='bg-secondary absolute top-3 right-3 z-10 flex flex-row items-center gap-0 rounded-sm pl-2'
          >
            <Watchlist
              domain={domain}
              tooltipPosition='bottom'
              dropdownPosition={isFirstInRow ? 'right' : 'left'}
              tooltipAlign={isFirstInRow ? 'left' : 'right'}
              watchlistId={watchlistId}
              showSettings={true}
              showSettingsArrow={false}
            />
          </div>
        )}
      </div>
      <div
        className={cn(
          'p-lg text-md flex w-full flex-1 flex-col justify-between gap-1',
          isBulkSelecting && 'pointer-events-none'
        )}
      >
        <div className='flex w-full flex-col'>
          {registrationStatus === GRACE_PERIOD ? (
            <p className='text-grace truncate font-semibold'>
              Grace {domain.expiry_date ? `(${formatTimeLeft(domain.expiry_date, 'grace')})` : ''}
            </p>
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
              <p className='leading-[18px] font-bold'>Unlisted</p>
            )
          ) : (
            <div
              className={cn(
                'flex items-center gap-px font-semibold',
                registrationStatus === PREMIUM ? 'text-premium' : 'text-available'
              )}
            >
              {registrationStatus === PREMIUM ? (
                <>
                  <p>$</p>
                  <p>
                    {premiumPrice.toLocaleString(navigator.language, {
                      maximumFractionDigits: 2,
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  <p className='text-md text-neutral font-medium'>
                    &nbsp;+ ${regPrice.usd.toLocaleString(navigator.language, { maximumFractionDigits: 0 })}/Year
                  </p>
                </>
              ) : (
                <>
                  <p>$</p>
                  <p>
                    {regPrice.usd.toLocaleString(navigator.language, { maximumFractionDigits: 0 })}&nbsp;
                    <span className='text-neutral font-medium'>/&nbsp;Year</span>
                  </p>
                </>
              )}
            </div>
          )}
          {registrationStatus === PREMIUM && domain.expiry_date && (
            <div className='text-md text-premium/70 flex items-center gap-px font-medium'>
              Premium ({formatTimeLeft(domain.expiry_date, 'premium')})
            </div>
          )}
          {registrationStatus === UNREGISTERED && (
            <p className='text-md text-available flex items-center gap-px font-medium'>Available</p>
          )}
          {domain.last_sale_price && domain.last_sale_currency && (
            <div className='flex items-center gap-[6px]'>
              <p className='text-light-400 truncate text-sm leading-[18px] font-medium'>Last sale:</p>
              <div className='flex items-center gap-1'>
                <Price
                  price={convertWeiPrice(domain.last_sale_price, domain.last_sale_currency, ethPrice)}
                  currencyAddress={domain.last_sale_currency as Address}
                  iconSize='16px'
                  fontSize='text-md'
                />
              </div>
            </div>
          )}
          {domain.clubs && domain.clubs.length > 0 && (
            <p className='text-md text-neutral mt-px truncate font-semibold'>
              {domain.clubs?.map((club) => CATEGORY_LABELS[club as keyof typeof CATEGORY_LABELS]).join(', ')}
            </p>
          )}
          {(profileTab.value === 'domains' || profileTab.value === 'watchlist') &&
            filterType === 'profile' &&
            domain.expiry_date && (
              <div className='flex items-center gap-1'>
                <p className='text-md text-neutral truncate font-semibold'>
                  Expiry: {formatExpiryDate(domain.expiry_date, { includeTime: false, dateDivider: '/' })}
                </p>
              </div>
            )}
          {profileTab.value === 'listings' && filterType === 'profile' && domain.listings[0]?.expires_at && (
            <div className='flex items-center gap-1'>
              <p className='text-md text-neutral truncate font-semibold'>
                Ends: {formatExpiryDate(domain.listings[0]?.expires_at, { includeTime: false, dateDivider: '/' })}
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
    </Link>
  )
}

export default Card
