import { Address } from 'viem'
import React from 'react'
import Name from './name'
import OfferAmount from './offerAmount'
import Expires from './expires'
import Actions from './actions'
import { cn } from '@/utils/tailwind'
import { DomainOfferType, OfferColumnType } from '@/types/domains'
import Offerrer from './offerrer'

interface OfferRowProps {
  offer: DomainOfferType
  displayedColumns: OfferColumnType[]
  currentUserAddress?: Address
}

const OfferRow: React.FC<OfferRowProps> = ({ offer, displayedColumns, currentUserAddress }) => {
  const columnWidth = `${100 / displayedColumns.length}%`

  const columns: Record<OfferColumnType, React.ReactNode> = {
    name: <Name offer={offer} />,
    offer_amount: <OfferAmount offer={offer} />,
    offerrer: <Offerrer offer={offer} />,
    expires: <Expires offer={offer} />,
    actions: <Actions offer={offer} currentUserAddress={currentUserAddress} />,
  }

  return (
    <div className='group md:px-md lg:px-lg flex h-[60px] w-full flex-row items-center justify-start gap-1 rounded-sm bg-transparent transition hover:bg-white/10'>
      {displayedColumns.map((column) => (
        <div
          key={column}
          className={cn('flex flex-row items-center gap-2', column === 'actions' && 'justify-end')}
          style={{ width: columnWidth }}
        >
          {columns[column]}
        </div>
      ))}
    </div>
  )
}

export default OfferRow
