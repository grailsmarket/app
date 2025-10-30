import React from 'react'
import { DomainOfferType } from '@/types/domains'
import { formatExpiryDate } from '@/utils/time/formatExpiryDate'

interface ExpiresProps {
  offer: DomainOfferType
}

const Expires: React.FC<ExpiresProps> = ({ offer }) => {
  return <p className='font-medium'>{formatExpiryDate(offer.expires_at)}</p>
}

export default Expires
