import React from 'react'
import User from '@/components/ui/user'
import { DomainOfferType } from '@/types/domains'

interface OfferrerProps {
  offer: DomainOfferType
}

const Offerrer: React.FC<OfferrerProps> = ({ offer }) => {
  return <User address={offer.buyer_address} />
}

export default Offerrer
