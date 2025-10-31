import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { Address } from 'viem'
import Price from '@/components/ui/price'

interface LastSaleProps {
  domain: MarketplaceDomainType
  columnCount: number
  index: number
}

// Last price of the domain (shows last sale if present, otherwise we fall back on the registration price)
const LastSale: React.FC<LastSaleProps> = ({ domain, columnCount, index }) => {
  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['last_sale'].getWidth(columnCount))}>
      {domain.last_sale_price && domain.last_sale_currency && (
        <Price
          price={domain.last_sale_price}
          currencyAddress={domain.last_sale_currency as Address}
          iconSize='16px'
          tooltipPosition={index === 0 ? 'bottom' : 'top'}
        />
      )}
    </div>
  )
}

export default LastSale
