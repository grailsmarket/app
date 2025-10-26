import React, { useMemo } from 'react'
import Tooltip from './tooltip'
import { formatEtherPrice } from '@/utils/formatEtherPrice'
import useETHPrice from '@/hooks/useETHPrice'
import Asset from './asset'

interface PriceProps {
  price: string | number
  asset: 'ETH' | 'USD'
  ethSize?: string
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
}

const Price: React.FC<PriceProps> = ({ price, ethSize = '14px', tooltipPosition = 'top' }) => {
  const { ethPrice } = useETHPrice()

  const priceInUSD = useMemo(() => {
    return (formatEtherPrice(price, true) as number ?? 0) * (ethPrice as number ?? 0)
  }, [price, ethPrice])

  return (
    <Tooltip label={`${priceInUSD.toFixed(2)} USD`} position={tooltipPosition} align='center'>
      <div className='flex flex-row items-center gap-1'>
        <Asset asset='ETH' ethSize={ethSize} />
        <p>{formatEtherPrice(price)}</p>
      </div>
    </Tooltip>
  )
}

export default Price
