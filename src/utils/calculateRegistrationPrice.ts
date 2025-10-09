import { MarketplaceDomainNameType } from '@/state/reducers/domains/marketplaceDomains'

export const calculateRegistrationPrice = (name: MarketplaceDomainNameType) => {
  const usdPrice = { 7: 640, 8: 160 }[name.length] ?? 5
  const ethPrice = usdPrice / 1800

  return {
    usd: usdPrice,
    eth: ethPrice,
  }
}
