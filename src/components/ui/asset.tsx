import React from 'react'
import Image from 'next/image'

import ethGray from 'public/tokens/eth.svg'
import usdc from 'public/tokens/usdc.svg'
import weth from 'public/tokens/weth.svg'

import { Address } from 'viem'
import { TOKENS } from '@/constants/web3/tokens'

interface AssetProps {
  currencyAddress: Address
  fontSize?: string
  iconSize?: string
}

const Asset: React.FC<AssetProps> = ({ currencyAddress, iconSize = '14px' }) => {
  const asset = TOKENS[currencyAddress as keyof typeof TOKENS]
  if (!asset) return null

  const assetImage = {
    ETH: ethGray,
    USDC: usdc,
    WETH: weth,
  }[asset]

  return <Image src={assetImage} alt={asset} style={{ height: iconSize }} className='w-auto' />
}

export default Asset
