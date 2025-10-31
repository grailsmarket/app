import React from 'react'
import { cn } from '@/utils/tailwind'
import Price from '@/components/ui/price'
import { DomainListingType, RegistrationStatus } from '@/types/domains'
import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'

interface ListPriceProps {
  listing: DomainListingType
  registrationStatus: RegistrationStatus
  columnCount: number
  index: number
}

const ListPrice: React.FC<ListPriceProps> = ({ listing, columnCount, index }) => {
  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['listed_price'].getWidth(columnCount), 'text-md')}>
      {listing && (
        <Price
          // @ts-expect-error - price_wei is a type from the watchlist
          price={listing.price || listing.price_wei}
          currencyAddress={listing.currency_address}
          tooltipPosition={index === 0 ? 'bottom' : 'top'}
          iconSize='16px'
        />
      )}
    </div>
  )
}

export default ListPrice
