import { MarketplaceDomainNameType } from '@/state/reducers/domains/marketplaceDomains'

export const calculateRegistrationPrice = (name: MarketplaceDomainNameType, ethUSDPrice: number) => {
  const usdPrice = { 7: 640, 8: 160 }[name.length] ?? 5
  const ethPrice = Math.round((usdPrice / ethUSDPrice) * 10 ** 18)

  return {
    usd: usdPrice,
    eth: ethPrice,
  }
}
