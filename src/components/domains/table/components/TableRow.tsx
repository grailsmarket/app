import React from 'react'
import { useAccount } from 'wagmi'
import { MarketplaceDomainType, MarketplaceHeaderColumn } from '@/types/domains'
import { checkNameValidity } from '@/utils/checkNameValidity'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'
import { GRACE_PERIOD } from '@/constants/domains/registrationStatuses'
import Name from './name'
import ListPrice from './listPrice'
import RegistryPrice from './RegistryPrice'
import LastSale from './lastSale'
import HighestOffer from './highestOffer'
import Expiration from './expiration'
import Actions from './actions'
import Link from 'next/link'
import { cn } from '@/utils/tailwind'

interface TableRowProps {
  domain: MarketplaceDomainType
  index: number
  displayedColumns: MarketplaceHeaderColumn[]
  watchlistId?: number | undefined
  isBulkRenewing?: boolean
  isBulkTransferring?: boolean
}

const TableRow: React.FC<TableRowProps> = ({
  domain,
  index,
  displayedColumns,
  watchlistId,
  isBulkRenewing,
  isBulkTransferring,
}) => {
  const { address } = useAccount()

  const domainListing = domain.listings[0]
  const domainIsValid = checkNameValidity(domain.name)
  const registrationStatus = getRegistrationStatus(domain.expiry_date)
  const canAddToCart = !(registrationStatus === GRACE_PERIOD || address?.toLowerCase() === domain.owner?.toLowerCase())

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
        index={index}
        columnCount={columnCount}
        canAddToCart={canAddToCart}
        watchlistId={watchlistId}
        isBulkRenewing={isBulkRenewing}
        isBulkTransferring={isBulkTransferring}
      />
    ),
  }

  return (
    <Link
      href={`/${domain.name}`}
      className={cn(
        'group hover:bg-foreground/10 px-sm md:p-md lg:p-lg flex h-[60px] w-full flex-row items-center justify-between rounded-sm transition',
        domainIsValid ? 'cursor-pointer opacity-100' : 'pointer-events-none cursor-not-allowed opacity-40'
      )}
    >
      {displayedColumns.map((column) => columns[column])}
    </Link>
  )
}

export default TableRow
