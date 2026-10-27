import PremiumPriceOracle from './premiumPriceOracle'

export const getPremiumPrice = (expiryDate: number, timestamp: number, version: number) => {
  const oracle = new PremiumPriceOracle(expiryDate, version)

  const premiumPrice = oracle.getAmountByDateRange(timestamp)
  return premiumPrice
}

export const getDaysFromPremium = (expiryDate: number, timestamp: number, version: number) => {
  const oracle = new PremiumPriceOracle(expiryDate, version)

  const daysFromPremium = oracle.getDaysPast(timestamp)
  return daysFromPremium
}
