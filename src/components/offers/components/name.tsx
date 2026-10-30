import React from 'react'
import { DomainOfferType } from '@/types/domains'
import NameImage from '@/components/ui/nameImage'
import NameVersionBadge from '@/components/ui/nameVersionBadge'
import HoverPrefetchLink from '@/components/ui/hoverPrefetchLink'
import { normalizeName } from '@/lib/ens'

interface NameProps {
  offer: DomainOfferType
}

const Name: React.FC<NameProps> = ({ offer }) => {
  // Extract name from the offer data
  const name = offer.name || 'Unknown'

  return (
    <HoverPrefetchLink
      href={`/${normalizeName(name)}`}
      className='flex max-w-full min-w-0 items-center gap-2 transition-opacity hover:opacity-80'
    >
      <NameImage
        name={name}
        version={offer.version}
        tokenId={offer.token_id}
        expiryDate={new Date().toISOString()}
        className='h-8 w-8 shrink-0 rounded-sm'
      />
      <p className='truncate text-sm font-medium text-white'>{name}</p>
      <NameVersionBadge version={offer.version} />
    </HoverPrefetchLink>
  )
}

export default Name
