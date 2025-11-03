import { BigNumber } from '@ethersproject/bignumber'

export const formatEtherPrice = (price: string | number, returnNumber?: boolean, maximumFractionDigits?: number) => {
  if (!price) return ''

  const locale = typeof window === 'undefined' ? 'default' : navigator.language

  // check if price exceeds total ETH supply (120,700,000)
  if (
    BigNumber.from(price.toString().replaceAll(',', '').replaceAll(' ', '').replace('.', ''))
      .div(BigNumber.from(10).pow(18))
      .gt(BigNumber.from(120700000))
  ) {
    if (returnNumber) {
      return 120700000
    }
    return '> 120.7M'
  }

  if (returnNumber) {
    return (
      BigNumber.from(price.toString().replaceAll(',', '').replaceAll(' ', '').replace('.', ''))
        .div(BigNumber.from(10).pow(12))
        .toNumber() /
      10 ** 6
    )
  }

  const bignumberPrice = BigNumber.from(price.toString().replaceAll(',', '').replaceAll(' ', '').replace('.', '')).div(
    BigNumber.from(10).pow(13)
  )

  const isBillion = bignumberPrice.gt(BigNumber.from(10).pow(15))
  const isMillion = bignumberPrice.gt(BigNumber.from(10).pow(12))
  const sizeIdentificator = isBillion ? ' B' : isMillion ? ' M' : ''

  const transformedPrice =
    (isBillion || isMillion
      ? bignumberPrice.div(BigNumber.from(10).pow(isBillion ? 10 : 7)).toNumber()
      : bignumberPrice.toNumber()) /
    10 ** 5

  if (transformedPrice === 0) return 0

  if (isMillion || isBillion)
    return (
      transformedPrice.toLocaleString(locale, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 1,
      }) + sizeIdentificator
    )

  if (transformedPrice < 0.00001) return '< 0.00001'

  if (transformedPrice < 0.0001)
    return transformedPrice.toLocaleString(locale, {
      maximumFractionDigits: 5,
      minimumFractionDigits: 2,
    })

  if (transformedPrice < 0.001)
    return transformedPrice.toLocaleString(locale, {
      maximumFractionDigits: 5,
      minimumFractionDigits: 2,
    })

  if (transformedPrice < 0.01)
    return transformedPrice.toLocaleString(locale, {
      maximumFractionDigits: 4,
      minimumFractionDigits: 2,
    })

  if (transformedPrice < 1)
    return transformedPrice.toLocaleString(locale, {
      maximumFractionDigits: maximumFractionDigits ?? 3,
      minimumFractionDigits: 2,
    })

  return transformedPrice.toLocaleString(locale, {
    maximumFractionDigits: maximumFractionDigits ?? 2,
    minimumFractionDigits: 2,
  })
}
