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
  index: number
}

const OfferRow: React.FC<OfferRowProps> = ({ offer, displayedColumns, currentUserAddress, index }) => {
  const columnWidth = `${(100 - 20) / displayedColumns.length}%`
  const nameWidth = `${(100 - 20) / displayedColumns.length + 15}%`
  const offerrerWidth = `${(100 - 20) / displayedColumns.length + 5}%`

  const columns: Record<OfferColumnType, React.ReactNode> = {
    name: <Name offer={offer} />,
    offer_amount: <OfferAmount offer={offer} index={index} />,
    offerrer: <Offerrer offer={offer} />,
    expires: <Expires offer={offer} />,
    actions: <Actions offer={offer} currentUserAddress={currentUserAddress} />,
  }

  return (
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
  )
}

export default OfferRow
