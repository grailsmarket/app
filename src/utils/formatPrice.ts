import { formatEther } from 'viem'
import { AssetType } from '../types/assets'

export const formatPrice = (price: string | null, asset: 'wei' | AssetType = 'ETH') => {
  if (!price) return null

  try {
    if (asset === 'wei')
      return parseFloat(formatEther(BigInt(price))).toLocaleString('default', {
        maximumFractionDigits: 3,
      })

    if (asset === 'ETH' || asset === 'WETH')
      return parseFloat(price).toLocaleString('default', {
        maximumFractionDigits: 3,
      })

    return parseFloat(price).toLocaleString('default', {
      maximumFractionDigits: 2,
    })
  } catch (e) {
    console.error('Invalid format', e)
    return price
  }
}
