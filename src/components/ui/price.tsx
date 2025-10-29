import { Address } from 'viem'
import React, { useMemo } from 'react'
import Asset from './asset'
import Tooltip from './tooltip'
import useETHPrice from '@/hooks/useETHPrice'
import { TOKENS } from '@/constants/web3/tokens'
import { formatPrice } from '@/utils/formatPrice'
import { formatEtherPrice } from '@/utils/formatEtherPrice'

interface PriceProps {
  price: string | number
  currencyAddress: Address
  iconSize?: string
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
}

const Price: React.FC<PriceProps> = ({ price, currencyAddress, iconSize = '14px', tooltipPosition = 'top' }) => {
  const asset = TOKENS[currencyAddress as keyof typeof TOKENS]

  const { ethPrice } = useETHPrice()

  const diffCurrencyPrice = useMemo(() => {
    if (asset === 'ETH' || asset === 'WETH') {
      return ((formatEtherPrice(price, true) as number) ?? 0) * ((ethPrice as number) ?? 0)
    } else {
      return formatPrice(price, asset, true) as number
    }
  }, [price, ethPrice, asset])

  return (
    <Tooltip label={`${diffCurrencyPrice.toFixed(2)} USD`} position={tooltipPosition} align='center'>
      <div className='flex flex-row items-center gap-1'>
        <Asset currencyAddress={currencyAddress} iconSize={iconSize} />
        <p>{formatPrice(price, asset)}</p>
      </div>
    </Tooltip>
  )
}

export default Price
