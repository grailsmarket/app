export interface RegistrationPricing {
  baseRates: readonly bigint[]
  discountPoints: readonly { duration: bigint; numer: bigint }[]
  discountDenominator: bigint
  paymentTokenRatio: readonly [bigint, bigint]
}

export const calculateDurationDiscount = (labels: string[], durations: bigint[], pricing: RegistrationPricing) => {
  const { baseRates, discountPoints, discountDenominator, paymentTokenRatio } = pricing
  const [tokenNumerator, tokenDenominator] = paymentTokenRatio

  if (!baseRates.length || labels.length !== durations.length || tokenDenominator === BigInt(0)) return null

  const toTokenAmount = (value: bigint) => (value * tokenNumerator + tokenDenominator - BigInt(1)) / tokenDenominator

  let undiscountedPrice = BigInt(0)
  let discountedPrice = BigInt(0)
  let totalBaseUnits = BigInt(0)
  let totalDiscountUnits = BigInt(0)

  for (let index = 0; index < labels.length; index++) {
    const length = Array.from(labels[index]).length
    const rate = baseRates[Math.min(length, baseRates.length) - 1] ?? BigInt(0)
    const duration = durations[index]
    const baseUnits = rate * duration
    let discountedUnits = baseUnits

    for (const point of discountPoints) {
      if (duration < point.duration) break
      discountedUnits = (baseUnits * point.numer) / discountDenominator
    }

    totalBaseUnits += baseUnits
    totalDiscountUnits += baseUnits - discountedUnits
    undiscountedPrice += toTokenAmount(baseUnits)
    discountedPrice += toTokenAmount(discountedUnits)
  }

  return {
    undiscountedPrice,
    discountedPrice,
    amount: undiscountedPrice - discountedPrice,
    percentage: totalBaseUnits > BigInt(0) ? (Number(totalDiscountUnits) / Number(totalBaseUnits)) * 100 : 0,
  }
}
