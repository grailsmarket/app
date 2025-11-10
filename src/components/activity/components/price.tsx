import React from 'react'
import { Address } from 'viem'
import PriceComponent from '@/components/ui/price'

interface PriceProps {
  price: string | number | null
  currencyAddress: Address | null
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
}

const Price: React.FC<PriceProps> = ({ price, currencyAddress, tooltipPosition }) => {
  if (!currencyAddress || !price) return null

  return (
    <div className='flex w-full flex-row items-center gap-1'>
      <PriceComponent
        price={price}
        currencyAddress={currencyAddress}
        tooltipPosition={tooltipPosition}
        iconSize='20px'
        fontSize='text-lg font-semibold'
      />
    </div>
  )
}

export default Price
