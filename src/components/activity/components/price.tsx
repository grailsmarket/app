import Asset from '@/components/ui/asset'
import { TOKENS } from '@/constants/web3/tokens'
import { formatPrice } from '@/utils/formatPrice'
import React from 'react'
import { Address } from 'viem'

interface PriceProps {
  price: string | number | null
  currencyAddress: Address | null
}

const Price: React.FC<PriceProps> = ({ price, currencyAddress }) => {
  if (!currencyAddress || !price) return null

  const asset = TOKENS[currencyAddress as keyof typeof TOKENS]

  return (
    <div className='flex flex-row items-center gap-1 w-full'>
      <Asset currencyAddress={currencyAddress} iconSize='16px' />
      <p>{price ? formatPrice(price, asset) : null}</p>
    </div>
  )
}

export default Price
