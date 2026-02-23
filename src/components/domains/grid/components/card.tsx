import React, { useMemo } from 'react'
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
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import { useFilterContext } from '@/context/filters'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectBulkSelect,
  addBulkSelectDomain,
  removeBulkSelectDomain,
  addBulkSelectPreviousListing,
  removeBulkSelectPreviousListing,
  setAnchorIndex,
  setHoveredIndex,
  addBulkSelectWatchlistId,
  removeBulkSelectWatchlistId,
} from '@/state/reducers/modals/bulkSelectModal'
import Link from 'next/link'
import { beautifyName, normalizeName } from '@/lib/ens'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { convertWeiPrice } from '@/utils/convertWeiPrice'
import useETHPrice from '@/hooks/useETHPrice'
import { useExpiryCountdown } from '@/hooks/useExpiryCountdown'
import { calculateRegistrationPrice } from '@/utils/calculateRegistrationPrice'
import Watchlist from '@/components/ui/watchlist'
import User from '@/components/ui/user'
import Image from 'next/image'
import { fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import { useQuery } from '@tanstack/react-query'
import { DAY_IN_SECONDS } from '@/constants/time'
import { getCategoryDetails } from '@/utils/getCategoryDetails'
import { useCategories } from '@/components/filters/hooks/useCategories'
import { localizeNumber } from '@/utils/localizeNumber'

interface CardProps {
  domain: MarketplaceDomainType
  index?: number
  allDomains?: MarketplaceDomainType[]
  className?: string
  isFirstInRow?: boolean
  watchlistId?: number | undefined
}

const Card: React.FC<CardProps> = ({ domain, index, allDomains, className, isFirstInRow, watchlistId }) => {
  const { address } = useAccount()
  const dispatch = useAppDispatch()
  const { ethPrice } = useETHPrice()
  const { categories } = useCategories()
  const { filterType } = useFilterContext()
  const { selectedTab: profileTab } = useAppSelector(selectUserProfile)
  const { isSelecting: isBulkSelecting } = useAppSelector(selectBulkSelect)
  const domainIsValid = checkNameValidity(domain?.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const isMyDomain = address?.toLowerCase() === domain.owner?.toLowerCase()
  const canAddToCart = !(EXPIRED_STATUSES.includes(registrationStatus) || isMyDomain)
  const domainListing = domain.listings[0]
  // const grailsListings = domain.listings.filter((listing) => listing.source === 'grails')
  const { domains: selectedDomains, anchorIndex, hoveredIndex, isShiftPressed } = useAppSelector(selectBulkSelect)
  const isSelected = isBulkSelecting && selectedDomains.some((d) => d.name === domain.name)
  const category = categories?.find((c) => c.name === domain.clubs[0])
  const clubRank = category?.name.includes('prepunk')
    ? domain.club_ranks?.find((rank) => rank.club === domain.clubs[0])?.rank
    : null

  // Calculate if this item is in the preview range (between anchor and hovered, shift pressed, not already selected)
  const isInPreviewRange = (() => {
    if (!isBulkSelecting || !isShiftPressed || anchorIndex === null || hoveredIndex === null || index === undefined) {
      return false
    }
    if (isSelected) return false // Don't show preview for already selected items
    const start = Math.min(anchorIndex, hoveredIndex)
    const end = Math.max(anchorIndex, hoveredIndex)
    return index >= start && index <= end
  })()

  // Determine countdown type based on registration status
  const countdownType =
    registrationStatus === PREMIUM ? 'premium' : registrationStatus === GRACE_PERIOD ? 'grace' : null
  const { premiumPrice, timeLeftString } = useExpiryCountdown(domain.expiry_date, countdownType)
  const regPrice = calculateRegistrationPrice(domain.name, ethPrice)

  const { data: brokerAccount } = useQuery({
    queryKey: ['brokerAccount', domainListing?.broker_address],
    queryFn: async () => {
      if (!domainListing?.broker_address) return null
      const response = await fetchAccount(domainListing.broker_address)
      return response
    },
    enabled: !!domainListing?.broker_address,
  })

  const backgroundColor = useMemo(() => {
    if (isBulkSelecting) {
      return isSelected ? 'bg-primary/20' : isInPreviewRange ? 'bg-primary/10' : 'hover:bg-primary/10'
    }

    if (registrationStatus === UNREGISTERED) return 'bg-available/10'
    if (registrationStatus === PREMIUM) return 'bg-premium/10'
    if (registrationStatus === GRACE_PERIOD) return 'bg-grace/10'
    if (registrationStatus === REGISTERED) {
      if (domainListing) return 'bg-foreground/20'
    }

    return ''
  }, [isBulkSelecting, isSelected, isInPreviewRange, registrationStatus, domainListing])

  const selectDomain = (d: MarketplaceDomainType) => {
    dispatch(addBulkSelectDomain(d))
    const listings = d.listings?.filter((listing) => listing.source === 'grails') || []
    listings.forEach((listing) => dispatch(addBulkSelectPreviousListing(listing)))

    if (watchlistId) {
      dispatch(addBulkSelectWatchlistId(watchlistId))
    }
  }

  const deselectDomain = (d: MarketplaceDomainType) => {
    dispatch(removeBulkSelectDomain(d))
    const listings = d.listings?.filter((listing) => listing.source === 'grails') || []
    listings.forEach((listing) => dispatch(removeBulkSelectPreviousListing(listing)))

    if (watchlistId) {
      dispatch(removeBulkSelectWatchlistId(watchlistId))
    }
  }

  const handleBulkSelectClick = (e: React.MouseEvent) => {
    if (!isBulkSelecting || index === undefined) return

    e.preventDefault()
    e.stopPropagation()

    const isShiftClick = e.shiftKey

    if (isShiftClick && anchorIndex !== null && allDomains) {
      // Shift-click with existing anchor: select range
      const start = Math.min(anchorIndex, index)
      const end = Math.max(anchorIndex, index)
      const domainsInRange = allDomains.slice(start, end + 1)

      // Add all domains in range to selection
      domainsInRange.forEach((d) => selectDomain(d))

      if (watchlistId) {
        domainsInRange.forEach(
          (d) => d.watchlist_record_id && dispatch(addBulkSelectWatchlistId(d.watchlist_record_id))
        )
      }

      // Update anchor to current index
      dispatch(setAnchorIndex(index))
    } else if (isShiftClick && anchorIndex === null) {
      // Shift-click without anchor: select single item and set anchor
      selectDomain(domain)
      if (watchlistId && domain.watchlist_record_id) {
        dispatch(addBulkSelectWatchlistId(domain.watchlist_record_id))
      }
      dispatch(setAnchorIndex(index))
    } else if (!isShiftClick && isSelected) {
      // Regular click on selected item: deselect and reset anchor
      deselectDomain(domain)
      if (watchlistId && domain.watchlist_record_id) {
        dispatch(removeBulkSelectWatchlistId(domain.watchlist_record_id))
      }
      dispatch(setAnchorIndex(null))
    } else if (!isShiftClick && !isSelected) {
      // Regular click on unselected item: select and set as anchor
      selectDomain(domain)
      if (watchlistId && domain.watchlist_record_id) {
        dispatch(addBulkSelectWatchlistId(domain.watchlist_record_id))
      }
      dispatch(setAnchorIndex(index))
    }
  }

  return (
    <Link
      href={`/${normalizeName(domain.name)}`}
      onClick={(e) => {
        if (isBulkSelecting) {
          handleBulkSelectClick(e)
        }
      }}
      onMouseEnter={() => {
        if (isBulkSelecting && index !== undefined) {
          dispatch(setHoveredIndex(index))
        }
      }}
      onMouseLeave={() => {
        if (isBulkSelecting) {
          dispatch(setHoveredIndex(null))
        }
      }}
      className={cn(
        'group bg-secondary flex h-full w-full cursor-pointer flex-col rounded-sm opacity-100 transition hover:opacity-100 md:opacity-80',
        !domainIsValid && 'pointer-events-none opacity-40',
        backgroundColor,
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

        <div
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          className={cn(
            'bg-secondary absolute top-3 right-3 z-10 flex flex-row items-center gap-0 rounded-sm',
            watchlistId ? 'pl-2' : 'justify-center p-1'
          )}
        >
          <Watchlist
            domain={domain}
            tooltipPosition='bottom'
            dropdownPosition={isFirstInRow ? 'right' : 'left'}
            tooltipAlign={isFirstInRow ? 'left' : 'right'}
            watchlistId={watchlistId || domain.watchlist_record_id}
            showSettings={watchlistId ? true : false}
            showSettingsArrow={false}
            fetchWatchSettings={false}
          />
        </div>
      </div>
      <div
        className={cn(
          'flex w-full flex-1 flex-col justify-between gap-[3px] p-3.5 text-lg',
          isBulkSelecting && 'pointer-events-none'
        )}
      >
        <div className='flex w-full flex-col gap-1'>
          {registrationStatus === GRACE_PERIOD ? (
            <Tooltip
              label={`Ends ${formatExpiryDate(new Date(new Date(domain.expiry_date || '').getTime() + 90 * DAY_IN_SECONDS * 1000).toISOString(), { includeTime: true, dateDivider: '/' })}`}
              align='left'
              position='top'
            >
              <p className='text-grace truncate font-semibold'>Grace {timeLeftString ? `(${timeLeftString})` : ''}</p>
            </Tooltip>
          ) : registrationStatus === REGISTERED ? (
            domainListing ? (
              <div className='flex items-center gap-1'>
                <Price
                  price={domainListing.price || domainListing.price_wei}
                  currencyAddress={domainListing.currency_address}
                  iconSize='17px'
                  fontSize='text-xl font-semibold'
                />
                {domainListing.broker_address && domainListing.broker_fee_bps && (
                  <Tooltip
                    label={`${brokerAccount?.ens?.name ? beautifyName(brokerAccount?.ens?.name) : truncateAddress(domainListing.broker_address)} - ${domainListing.broker_fee_bps / 100}%`}
                    position={index === 0 ? 'bottom' : 'top'}
                    align='left'
                  >
                    <p className='bg-primary/20 text-primary hover:bg-primary/30 rounded-sm px-1.5 py-0.5 text-xs font-semibold transition-colors'>
                      Brokered
                    </p>
                  </Tooltip>
                )}
              </div>
            ) : (
              <p className='leading-[18px] font-bold'>Unlisted</p>
            )
          ) : (
            <div className='flex flex-col gap-px'>
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
                      &nbsp;+&nbsp;${regPrice.usd.toLocaleString(navigator.language, { maximumFractionDigits: 0 })}/yr
                    </p>
                  </>
                ) : (
                  <>
                    <p>$</p>
                    <p>
                      {regPrice.usd.toLocaleString(navigator.language, { maximumFractionDigits: 0 })}&nbsp;
                      <span className='text-neutral font-medium'>/&nbsp;yr</span>
                    </p>
                  </>
                )}
              </div>
              {registrationStatus === PREMIUM && timeLeftString && (
                <div className='text-md text-premium/70 flex items-center gap-px font-medium'>
                  Premium ({timeLeftString})
                </div>
              )}
              {registrationStatus === UNREGISTERED && (
                <p className='text-md text-available flex items-center gap-px font-medium'>Available</p>
              )}
            </div>
          )}
          {domain.clubs && domain.clubs.length > 0 && (
            <div className='flex max-w-full flex-row items-center gap-1 truncate'>
              <div className='text-md text-neutral flex max-w-fit min-w-fit items-center gap-1 font-semibold'>
                <Image
                  src={getCategoryDetails(domain.clubs[0]).avatar}
                  alt={domain.clubs[0] as string}
                  width={16}
                  height={16}
                  className='rounded-full'
                />
                <p className='truncate'>{category?.display_name}</p>
                {clubRank ? <p className='truncate'>#{localizeNumber(clubRank)}</p> : null}
                {domain.clubs.length > 1 && (
                  <p className='text-md text-neutral truncate font-bold'>+{domain.clubs.length - 1}</p>
                )}
              </div>
            </div>
          )}
          {filterType !== 'category' &&
            domain.last_sale_price &&
            domain.last_sale_currency &&
            domain.last_sale_date && (
              <div className='text-neutral flex items-center gap-[4px]'>
                {/* <p className='text-light-400 truncate text-sm leading-[18px] font-medium'>Last sale:</p> */}
                <div className='flex items-center gap-1'>
                  <Price
                    price={convertWeiPrice(domain.last_sale_price, domain.last_sale_currency, ethPrice)}
                    currencyAddress={domain.last_sale_currency as Address}
                    iconSize='14px'
                    fontSize='text-md font-semibold text-neutral'
                  />
                </div>
                <p>-</p>
                <div>
                  <p className='text-md truncate font-semibold'>
                    {formatExpiryDate(domain.last_sale_date, { includeTime: false, dateDivider: '/' })}
                  </p>
                </div>
              </div>
            )}
          {(((profileTab.value === 'domains' ||
            profileTab.value === 'watchlist' ||
            profileTab.value === 'grace' ||
            profileTab.value === 'broker') &&
            filterType === 'profile') ||
            filterType === 'category') &&
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
        <div className='flex flex-col gap-2'>
          {domain.owner &&
            (filterType !== 'profile' || profileTab.value === 'watchlist' || profileTab.value === 'broker') && (
              <User
                address={domain.owner as Address}
                className='max-w-full'
                wrapperClassName='justify-start! max-w-full'
              />
            )}
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
      </div>
    </Link>
  )
}

export default Card
