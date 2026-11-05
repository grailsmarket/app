import { CompromisedInfoType } from '@/types/domains'

/**
 * Stolen-name rules (backend compromised_names table):
 * a compromised name's listing can only be bought by, and its offers only accepted from,
 * the wallet it was taken from (or an admin-approved recovery wallet).
 */
export const isCompromisedCounterparty = (
  compromised: CompromisedInfoType | null | undefined,
  address: string | null | undefined
) => {
  if (!compromised || !address) return false
  const addr = address.toLowerCase()
  return (
    compromised.original_owner.toLowerCase() === addr ||
    compromised.allowed_addresses.some((allowed) => allowed.toLowerCase() === addr)
  )
}

// True when `address` is blocked from trading this compromised name (false for normal names)
export const isBlockedByCompromise = (
  compromised: CompromisedInfoType | null | undefined,
  address: string | null | undefined
) => !!compromised && !isCompromisedCounterparty(compromised, address)

export const COMPROMISED_LISTING_TOOLTIP = 'This name was reported stolen. Only the original owner can buy it back.'
export const COMPROMISED_OFFER_TOOLTIP =
  'This name was reported stolen. Only offers from the original owner can be accepted.'
