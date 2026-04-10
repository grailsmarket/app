'use client'

import { Address } from 'viem'
import React, { useState } from 'react'
import Name from './name'
import OfferAmount from './offerAmount'
import Expires from './expires'
import Actions from './actions'
import { cn } from '@/utils/tailwind'
import { DomainOfferType, OfferColumnType } from '@/types/domains'
import Offerrer from './offerrer'
import NameImage from '@/components/ui/nameImage'
import Link from 'next/link'
import { normalizeName, beautifyName } from '@/lib/ens'

interface OfferRowProps {
  offer: DomainOfferType
  displayedColumns: OfferColumnType[]
  currentUserAddress?: Address
  index: number
}

const OfferRow: React.FC<OfferRowProps> = ({ offer, displayedColumns, currentUserAddress, index }) => {
  const [expanded, setExpanded] = useState(false)
  const columnWidth = `${(100 - 20) / displayedColumns.length}%`
  const nameWidth = `${(100 - 20) / displayedColumns.length + 15}%`
  const offerrerWidth = `${(100 - 20) / displayedColumns.length + 5}%`

  const isNOfMany = offer.offer_type === 'n_of_many' && offer.n_of_many_names && offer.n_of_many_names.length > 0

  const columns: Record<OfferColumnType, React.ReactNode> = {
    name: (
      <Name
        offer={offer}
        expanded={isNOfMany ? expanded : undefined}
        onToggle={isNOfMany ? () => setExpanded(!expanded) : undefined}
      />
    ),
    offer_amount: <OfferAmount offer={offer} index={index} />,
    offerrer: <Offerrer offer={offer} />,
    expires: <Expires offer={offer} />,
    actions: <Actions offer={offer} currentUserAddress={currentUserAddress} />,
  }

  return (
    <div>
      <div className='group px-md border-tertiary lg:px-lg flex h-[60px] w-full flex-row items-center justify-between gap-1 border-b bg-transparent transition hover:bg-white/10'>
        {displayedColumns.map((column) => (
          <div
            key={column}
            className={cn('flex flex-row items-center gap-2', column === 'actions' && 'justify-end')}
            style={{ width: column === 'name' ? nameWidth : column === 'offerrer' ? offerrerWidth : columnWidth }}
          >
            {columns[column]}
          </div>
        ))}
      </div>
      {isNOfMany && expanded && (
        <div className='border-tertiary border-b'>
          {offer.n_of_many_names!.map((name) => (
            <div
              key={name}
              className='px-md lg:px-lg bg-secondary/50 flex h-[48px] w-full flex-row items-center gap-1'
            >
              <div style={{ width: nameWidth }}>
                <Link
                  href={`/${normalizeName(name)}`}
                  className='flex items-center gap-2 pl-10 transition-opacity hover:opacity-80'
                >
                  <NameImage
                    name={name}
                    tokenId=''
                    expiryDate={new Date().toISOString()}
                    className='h-7 w-7 rounded-sm'
                  />
                  <p className='truncate text-sm font-medium text-white'>{beautifyName(name)}</p>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OfferRow
