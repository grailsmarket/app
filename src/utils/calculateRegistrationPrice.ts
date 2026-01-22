import { MarketplaceDomainNameType } from '@/state/reducers/domains/marketplaceDomains'

/**
 * Get the character length of a string, properly handling Unicode/emojis.
 * Uses spread operator to count Unicode code points, matching ENS's StringUtils.strlen()
 */
const getCharacterLength = (str: string): number => {
  return [...str].length
}

/**
 * Calculate ENS domain registration price for 1 year.
 * Pricing tiers match the official ENS StablePriceOracle contract:
 * - 3 characters: $640/year
 * - 4 characters: $160/year
 * - 5+ characters: $5/year
 */
export const calculateRegistrationPrice = (name: MarketplaceDomainNameType, ethUSDPrice: number) => {
  // Remove .eth suffix to get the label
  const label = name.endsWith('.eth') ? name.slice(0, -4) : name

  // Get proper character length (handles emojis/unicode)
  const length = getCharacterLength(label)

  // ENS pricing tiers (USD per year)
  let usdPrice: number
  if (length >= 5) {
    usdPrice = 5
  } else if (length === 4) {
    usdPrice = 160
  } else {
    // 3 characters or less (1-2 char names are typically reserved)
    usdPrice = 640
  }

  // Convert USD to Wei: (usdPrice / ethUSDPrice) * 10^18
  // This matches the contract's attoUSDToWei conversion logic
  const ethPrice = Math.round((usdPrice / ethUSDPrice) * 10 ** 18)

  return {
    usd: usdPrice,
    eth: ethPrice,
  }
}
