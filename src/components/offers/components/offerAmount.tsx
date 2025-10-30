import React from 'react'
import Price from '@/components/ui/price'
import { DomainOfferType } from '@/types/domains'

interface OfferAmountProps {
  offer: DomainOfferType
}

const OfferAmount: React.FC<OfferAmountProps> = ({ offer }) => {
  return (
    <Price price={offer.offer_amount_wei} currencyAddress={offer.currency_address} fontSize='text-sm' iconSize='14px' />
  )
}

export default OfferAmount
