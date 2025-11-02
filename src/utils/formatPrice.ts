import { AssetType } from '../types/assets'
import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { formatEtherPrice } from './formatEtherPrice'

export const formatPrice = (price: string | number | null, asset: AssetType = 'ETH', returnNumber?: boolean) => {
  if (!price) return null

  const decimalPlaces = TOKEN_DECIMALS[asset]

  try {
    if (asset === 'USDC') {
      const transformedPrice = (typeof price === 'string' ? parseFloat(price) : price) / 10 ** decimalPlaces

      if (returnNumber) return transformedPrice

      const findSizeIdentifier = (price: number) => {
        if (price >= 1000000000) return { identifier: 'B', multiplier: 1000000000 }
        if (price >= 1000000) return { identifier: 'M', multiplier: 1000000 }
        // if (price >= 1000) return { identifier: 'k', multiplier: 1000 }
        return { identifier: '', multiplier: 1 }
      }

      const { identifier, multiplier } = findSizeIdentifier(transformedPrice)

      return (
        (transformedPrice / multiplier).toLocaleString('default', {
          maximumFractionDigits: 2,
          minimumFractionDigits: returnNumber ? 0 : 2,
        }) + identifier
      )
    }

    return formatEtherPrice(price, returnNumber)
  } catch (e) {
    console.error('Invalid format', e)
    return price
  }
}
