import { ALL_MARKETPLACE_COLUMNS } from '@/constants/domains/marketplaceDomains'
import { MarketplaceDomainType } from '@/types/domains'
import { cn } from '@/utils/tailwind'
import React from 'react'
import Price from '@/components/ui/price'

interface HighestOfferProps {
  domain: MarketplaceDomainType
  columnCount: number
  index: number
}

const HighestOffer: React.FC<HighestOfferProps> = ({ domain, columnCount, index }) => {
  const highestOfferPrice = domain.highest_offer_wei
  const highestOfferCurrency = domain.highest_offer_currency

  return (
    <div className={cn(ALL_MARKETPLACE_COLUMNS['highest_offer'].getWidth(columnCount))}>
      {highestOfferPrice && highestOfferCurrency && (
        <>
          <Price
            price={highestOfferPrice}
            currencyAddress={highestOfferCurrency}
            tooltipPosition={index === 0 ? 'bottom' : 'top'}
            iconSize='16px'
          />
          {/* <p className='text-md text-neutral'>Expires {formatExpiryDate(domain.high, { includeTime: false, dateDivider: '/' })}</p> */}
        </>
      )}
    </div>
  )
}

export default HighestOffer
