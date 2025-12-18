import { BigNumber } from '@ethersproject/bignumber'
import { TOKENS } from '@/constants/web3/tokens'

export const convertLastSalePrice = (price: string, currency: string, ethPrice?: number | null) => {
  const lastSaleCurrency = TOKENS[currency as keyof typeof TOKENS]
  return lastSaleCurrency === 'USDC'
    ? BigNumber.from(price)
        .div(BigNumber.from(10).pow(12))
        .mul(BigNumber.from(ethPrice?.toFixed(0) ?? 3000))
        .toString()
    : price
}
