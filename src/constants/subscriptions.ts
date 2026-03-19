export const TIER_MAP: Record<number, { name: string; label: string }> = {
  0: { name: 'Free', label: 'Free Plan' },
  1: { name: 'PRO', label: 'PRO Subscription' },
  2: { name: 'PLUS', label: 'PLUS Subscription' },
  3: { name: 'GOLD', label: 'GOLD Subscription' },
}

export const getTierDisplayName = (tierId: number): string => {
  return TIER_MAP[tierId]?.name ?? `Tier ${tierId}`
}

export const SUBSCRIBABLE_TIERS = [1, 2, 3]
