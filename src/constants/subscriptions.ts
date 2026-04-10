export const TIER_MAP: Record<number, { name: string; label: string }> = {
  0: { name: 'Free', label: 'Free Plan' },
  1: { name: 'PLUS', label: 'PLUS Subscription' },
  2: { name: 'PRO', label: 'PRO Subscription' },
  3: { name: 'GOLD', label: 'GOLD Subscription' },
  4: { name: 'PATRON', label: 'PATRON Subscription' },
  5: { name: 'LEGEND', label: 'LEGEND Subscription' },
}

// Reverse lookup: tier string → tierId
export const TIER_STRING_TO_ID: Record<string, number> = {
  free: 0,
  plus: 1,
  pro: 2,
  gold: 3,
  patron: 4,
  legend: 5,
}

export const getTierDisplayName = (tierId: number): string => {
  return TIER_MAP[tierId]?.name ?? `Tier ${tierId}`
}

export const getTierIdFromString = (tier: string): number => {
  return TIER_STRING_TO_ID[tier.toLowerCase()] ?? 0
}

export const SUBSCRIBABLE_TIERS = [1, 2, 3, 4, 5]
