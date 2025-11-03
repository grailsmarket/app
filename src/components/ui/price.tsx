import { Address } from 'viem'
import React, { useMemo } from 'react'
import Asset from './asset'
import Tooltip from './tooltip'
import useETHPrice from '@/hooks/useETHPrice'
import { TOKENS } from '@/constants/web3/tokens'
import { formatPrice } from '@/utils/formatPrice'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import { cn } from '@/utils/tailwind'

interface PriceProps {
  price: string | number
  currencyAddress: Address
  usdPrice?: string | number
  iconSize?: string
  fontSize?: string
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  alignTooltip?: 'left' | 'center' | 'right'
}

const Price: React.FC<PriceProps> = ({
  price,
  currencyAddress,
  usdPrice,
  iconSize = '14px',
  fontSize = 'text-lg',
  tooltipPosition = 'top',
  alignTooltip = 'center',
}) => {
  const asset = TOKENS[currencyAddress as keyof typeof TOKENS]

  const { ethPrice } = useETHPrice()

  const diffCurrencyPrice = useMemo(() => {
    if (asset === 'ETH' || asset === 'WETH') {
      if (usdPrice) return usdPrice
      const USDPrice = ((formatEtherPrice(price, true) as number) ?? 0) * ((ethPrice as number) ?? 0)
      return formatPrice(USDPrice * 10 ** 6, 'USDC') as number
    } else {
      return formatPrice(price, asset, true) as number
    }
  }, [price, ethPrice, asset, usdPrice])

  return (
    <Tooltip label={`${diffCurrencyPrice} USD`} position={tooltipPosition} align={alignTooltip}>
      <div className='flex flex-row items-center gap-1'>
        <Asset currencyAddress={currencyAddress} iconSize={iconSize} />
        <p className={cn(fontSize)}>{formatPrice(price, asset)}</p>
      </div>
    </Tooltip>
  )
}

export default Price
