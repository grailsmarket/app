import React, { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { MarketplaceDomainType, MarketplaceHeaderColumn } from '@/types/domains'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import {
  EXPIRED_STATUSES,
  GRACE_PERIOD,
  PREMIUM,
  REGISTERABLE_STATUSES,
  REGISTERED,
  UNREGISTERED,
} from '@/constants/domains/registrationStatuses'
import Name from './name'
import LastSale from './lastSale'
import HighestOffer from './highestOffer'
import Expiration from './expiration'
import Actions from './actions'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { cn } from '@/utils/tailwind'
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
import { normalizeName } from '@/lib/ens'
import Price from './Price'
import User from '@/components/ui/user'
import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'

interface TableRowProps {
  domain: MarketplaceDomainType
  index: number
  allDomains?: MarketplaceDomainType[]
  displayedColumns: MarketplaceHeaderColumn[]
  watchlistId?: number | undefined
  isBulkSelecting?: boolean
  showPreviousOwner?: boolean
}

const TableRow: React.FC<TableRowProps> = ({
  domain,
  index,
  allDomains,
  displayedColumns,
  watchlistId,
  isBulkSelecting,
  showPreviousOwner,
}) => {
  const { address } = useAccount()
  const dispatch = useAppDispatch()
  const domainListing = domain.listings[0]
  // const grailsListings = domain.listings.filter((listing) => listing.source === 'grails')
  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const canAddToCart = !(
    EXPIRED_STATUSES.includes(registrationStatus) || address?.toLowerCase() === domain.owner?.toLowerCase()
  )
  const { domains: selectedDomains, anchorIndex, hoveredIndex, isShiftPressed } = useAppSelector(selectBulkSelect)
  const isSelected = isBulkSelecting && selectedDomains.some((d) => d.name === domain.name)

  // Calculate if this item is in the preview range (between anchor and hovered, shift pressed, not already selected)
  const isInPreviewRange = (() => {
    if (!isBulkSelecting || !isShiftPressed || anchorIndex === null || hoveredIndex === null) {
      return false
    }
    if (isSelected) return false // Don't show preview for already selected items
    const start = Math.min(anchorIndex, hoveredIndex)
    const end = Math.max(anchorIndex, hoveredIndex)
    return index >= start && index <= end
  })()

  const columnCount = displayedColumns.length
  const columns: Record<MarketplaceHeaderColumn, React.ReactNode> = {
    domain: (
      <Name
        key={`${domain.name}-domain`}
        domain={domain}
        registrationStatus={registrationStatus}
        domainIsValid={domainIsValid}
        columnCount={columnCount}
      />
    ),
    price: (
      <Price
        key={`${domain.name}-price`}
        name={domain.name}
        expiry_date={domain.expiry_date}
        listing={domainListing}
        registrationStatus={registrationStatus}
        columnCount={columnCount}
        index={index}
        showGracePeriod={!displayedColumns.includes('expires')}
      />
    ),
    last_sale: <LastSale key={`${domain.name}-last_sale`} domain={domain} columnCount={columnCount} index={index} />,
    highest_offer: (
      <HighestOffer key={`${domain.name}-highest_offer`} domain={domain} columnCount={columnCount} index={index} />
    ),
    expires: (
      <Expiration
        key={`${domain.name}-expires`}
        domain={domain}
        columnCount={columnCount}
        registrationStatus={registrationStatus}
      />
    ),
    actions: (
      <Actions
        key={`${domain.name}-actions`}
        domain={domain}
        index={index}
        columnCount={columnCount}
        canAddToCart={canAddToCart}
        watchlistId={watchlistId}
        isBulkSelecting={isBulkSelecting}
        registrationStatus={registrationStatus}
      />
    ),
    owner: (
      <div
        key={`${domain.name}-owner`}
        className={cn(ALL_MARKETPLACE_COLUMNS['owner'].getWidth(columnCount), 'relative pr-1')}
      >
        {(showPreviousOwner || !REGISTERABLE_STATUSES.includes(registrationStatus)) && domain.owner && (
          <User
            address={domain.owner as `0x${string}`}
            className='max-w-[90%]'
            wrapperClassName='justify-start! max-w-full'
          />
        )}
      </div>
    ),
  }

  const backgroundColor = useMemo(() => {
    if (isBulkSelecting) {
      return isSelected ? 'bg-primary/20' : isInPreviewRange ? 'bg-primary/10' : 'hover:bg-primary/10'
    }

    if (registrationStatus === UNREGISTERED) return 'bg-available/5 hover:bg-available/10'
    if (registrationStatus === PREMIUM) return 'bg-premium/5 hover:bg-premium/10'
    if (registrationStatus === GRACE_PERIOD) return 'bg-grace/5 hover:bg-grace/10'
    if (registrationStatus === REGISTERED) {
      if (domainListing) return 'bg-foreground/10 hover:bg-foreground/20'
    }

    return 'hover:bg-foreground/10'
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
    if (!isBulkSelecting) return

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

      // Update anchor to current index
      dispatch(setAnchorIndex(index))
    } else if (isShiftClick && anchorIndex === null) {
      // Shift-click without anchor: select single item and set anchor
      selectDomain(domain)
      dispatch(setAnchorIndex(index))
    } else if (!isShiftClick && isSelected) {
      // Regular click on selected item: deselect and reset anchor
      deselectDomain(domain)
      dispatch(setAnchorIndex(null))
    } else if (!isShiftClick && !isSelected) {
      // Regular click on unselected item: select and set as anchor
      selectDomain(domain)
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
        if (isBulkSelecting) {
          dispatch(setHoveredIndex(index))
        }
      }}
      onMouseLeave={() => {
        if (isBulkSelecting) {
          dispatch(setHoveredIndex(null))
        }
      }}
      className={cn(
        'group px-md md:p-md lg:p-lg border-tertiary flex h-[60px] w-full flex-row items-center justify-between border-b transition',
        domainIsValid ? 'cursor-pointer opacity-100' : 'pointer-events-none cursor-not-allowed opacity-40',
        backgroundColor
      )}
    >
      <div
        className={cn(
          'flex h-full w-full flex-row items-center justify-between gap-0',
          isBulkSelecting && 'pointer-events-none'
        )}
      >
        {displayedColumns.map((column) => columns[column])}
      </div>
    </Link>
  )
}

export default TableRow
