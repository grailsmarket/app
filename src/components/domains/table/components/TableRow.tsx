import React from 'react'
import Link from 'next/link'
import { useAccount } from 'wagmi'
import { MarketplaceDomainType, MarketplaceHeaderColumn } from '@/types/domains'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { EXPIRED_STATUSES, REGISTERED } from '@/constants/domains/registrationStatuses'
import Name from './name'
import ListPrice from './listPrice'
import RegistryPrice from './RegistryPrice'
import LastSale from './lastSale'
import HighestOffer from './highestOffer'
import Expiration from './expiration'
import Actions from './actions'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { cn } from '@/utils/tailwind'
import {
  addTransferModalDomain,
  removeTransferModalDomain,
  selectTransferModal,
} from '@/state/reducers/modals/transferModal'
import {
  addBulkRenewalModalDomain,
  removeBulkRenewalModalDomain,
  selectBulkRenewalModal,
} from '@/state/reducers/modals/bulkRenewalModal'
import {
  addMakeListingModalDomain,
  removeMakeListingModalDomain,
  selectMakeListingModal,
  removeMakeListingModalPreviousListing,
  addMakeListingModalPreviousListing,
} from '@/state/reducers/modals/makeListingModal'

interface TableRowProps {
  domain: MarketplaceDomainType
  index: number
  displayedColumns: MarketplaceHeaderColumn[]
  watchlistId?: number | undefined
  isBulkRenewing?: boolean
  isBulkTransferring?: boolean
  isBulkListing?: boolean
}

const TableRow: React.FC<TableRowProps> = ({
  domain,
  index,
  displayedColumns,
  watchlistId,
  isBulkRenewing,
  isBulkTransferring,
  isBulkListing,
}) => {
  const { address } = useAccount()
  const dispatch = useAppDispatch()
  const domainListing = domain.listings[0]
  const grailsListings = domain.listings.filter((listing) => listing.source === 'grails')
  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const canAddToCart = !(
    EXPIRED_STATUSES.includes(registrationStatus) || address?.toLowerCase() === domain.owner?.toLowerCase()
  )
  const { domains: transferModalDomains } = useAppSelector(selectTransferModal)
  const { domains: bulkRenewalDomains } = useAppSelector(selectBulkRenewalModal)
  const { domains: listingModalDomains } = useAppSelector(selectMakeListingModal)
  const isBulkAction = isBulkRenewing || isBulkTransferring || isBulkListing

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
    listed_price: (
      <ListPrice
        key={`${domain.name}-listed_price`}
        listing={domainListing}
        registrationStatus={registrationStatus}
        columnCount={columnCount}
        index={index}
      />
    ),
    registry_price: <RegistryPrice key={`${domain.name}-registry_price`} domain={domain} columnCount={columnCount} />,
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
        registrationStatus={registrationStatus}
        index={index}
        columnCount={columnCount}
        canAddToCart={canAddToCart}
        watchlistId={watchlistId}
        isBulkRenewing={isBulkRenewing}
        isBulkTransferring={isBulkTransferring}
        isBulkListing={isBulkListing}
      />
    ),
  }

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
          } else if (isBulkListing) {
            e.preventDefault()
            e.stopPropagation()

            if (registrationStatus !== REGISTERED) return

            if (listingModalDomains.some((d) => d.name === domain.name)) {
              dispatch(removeMakeListingModalDomain(domain))
              if (grailsListings.length > 0) dispatch(removeMakeListingModalPreviousListing(grailsListings[0]))
            } else {
              dispatch(addMakeListingModalDomain(domain))
              if (grailsListings.length > 0) dispatch(addMakeListingModalPreviousListing(grailsListings[0]))
            }
          }
        }
      }}
      className={cn(
        'group px-sm md:p-md lg:p-lg flex h-[60px] w-full flex-row items-center justify-between rounded-sm transition',
        domainIsValid ? 'cursor-pointer opacity-100' : 'pointer-events-none cursor-not-allowed opacity-40',
        isBulkAction ? 'hover:bg-primary/10' : 'hover:bg-foreground/10'
      )}
    >
      <div
        className={cn(
          'flex h-full w-full flex-row items-center justify-between',
          isBulkAction && 'pointer-events-none'
        )}
      >
        {displayedColumns.map((column) => columns[column])}
      </div>
    </Link>
  )
}

export default TableRow
