import React from 'react'
import Price from '@/components/ui/price'
import { DomainOfferType } from '@/types/domains'

interface OfferAmountProps {
  offer: DomainOfferType
  index: number
}

const OfferAmount: React.FC<OfferAmountProps> = ({ offer, index }) => {
  const tooltipPosition = index === 0 ? 'bottom' : 'top'
  return (
    <Price
      price={offer.offer_amount_wei}
      currencyAddress={offer.currency_address}
      fontSize='text-lg'
      iconSize='18px'
      tooltipPosition={tooltipPosition}
    />
  )
}

export default OfferAmount
