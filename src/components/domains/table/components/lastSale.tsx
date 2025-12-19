import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import { Address } from 'viem'
import Price from '@/components/ui/price'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'
import useETHPrice from '@/hooks/useETHPrice'
import { convertWeiPrice } from '@/utils/convertWeiPrice'

interface LastSaleProps {
  domain: MarketplaceDomainType
  columnCount: number
  index: number
}

// Last price of the domain (shows last sale if present, otherwise we fall back on the registration price)
const LastSale: React.FC<LastSaleProps> = ({ domain, columnCount, index }) => {
  const { ethPrice } = useETHPrice()
  const lastSalePrice =
    domain.last_sale_price && domain.last_sale_currency
      ? convertWeiPrice(domain.last_sale_price, domain.last_sale_currency, ethPrice)
      : null

  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['last_sale'].getWidth(columnCount))}>
      {lastSalePrice && domain.last_sale_currency && domain.last_sale_date && (
        <>
          <Price
            price={lastSalePrice}
            currencyAddress={domain.last_sale_currency as Address}
            usdPrice={domain.last_sale_price_usd ?? undefined}
            iconSize='16px'
            tooltipPosition={index === 0 ? 'bottom' : 'top'}
          />
          <p className='text-md text-neutral'>
            {formatExpiryDate(domain.last_sale_date, { includeTime: false, dateDivider: '/' })}
          </p>
        </>
      )}
    </div>
  )
}

export default LastSale
