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

      return transformedPrice.toLocaleString('default', {
        maximumFractionDigits: 2,
        minimumFractionDigits: returnNumber ? 0 : 2,
      })
    }

    return formatEtherPrice(price, returnNumber)
  } catch (e) {
    console.error('Invalid format', e)
    return price
  }
}
