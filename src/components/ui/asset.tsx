import React from 'react'
import Image from 'next/image'

import ethGray from 'public/icons/eth-gray.svg'

interface AssetProps {
  asset: string
  fontSize?: string
  ethSize?: string
}

const Asset: React.FC<AssetProps> = ({
  asset,
  fontSize,
  ethSize = '14px',
}) => {
  if (!asset) return null

  if (asset === 'USDC')
    return (
      <p className={`font-medium text-light-600 opacity-60 ${fontSize}`}>$</p>
    )

  return (
    <Image
      src={ethGray}
      alt="ETH"
      style={{ height: ethSize }}
      className="w-auto"
    />
  )
}

export default Asset
