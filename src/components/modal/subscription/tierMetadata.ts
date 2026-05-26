import type { StaticImageData } from 'next/image'
import logoPlus from 'public/subscription-assets/plus/logo.svg'
import logoPro from 'public/subscription-assets/pro/logo.svg'
import logoGold from 'public/subscription-assets/gold/logo.svg'
import logoPatron from 'public/subscription-assets/patreon/logo.svg'

export type TierColorClasses = {
  text: string
  border: string
  hoverBg: string
  selectedBg: string
  selectedShadow: string
}

export type TierMetadata = {
  tierId: number
  name: string
  tagline: string
  monthlyUSD: number | null
  logo: StaticImageData
  colors: TierColorClasses
}

// Yearly = 12 months at 15% discount, matching proPricing.tsx
export const ANNUAL_DISCOUNT = 0.15

export const getYearlyUSD = (monthlyUSD: number): number => monthlyUSD * 12 * (1 - ANNUAL_DISCOUNT)

const TIER_METADATA_INTERNAL: Record<number, TierMetadata> = {
  1: {
    tierId: 1,
    name: 'Plus',
    tagline: 'For the curious collector',
    monthlyUSD: 19.99,
    logo: logoPlus,
    colors: {
      text: 'text-white',
      border: 'border-white/40',
      hoverBg: 'hover:bg-white/10',
      selectedBg: 'bg-white/10',
      selectedShadow: 'shadow-lg shadow-white/30',
    },
  },
  2: {
    tierId: 2,
    name: 'Pro',
    tagline: 'For power domainers',
    monthlyUSD: 49.99,
    logo: logoPro,
    colors: {
      text: 'text-primary',
      border: 'border-primary/50',
      hoverBg: 'hover:bg-primary/10',
      selectedBg: 'bg-primary/10',
      selectedShadow: 'shadow-lg shadow-primary/40',
    },
  },
  3: {
    tierId: 3,
    name: 'Gold',
    tagline: 'For whales & insiders',
    monthlyUSD: 99.99,
    logo: logoGold,
    colors: {
      text: 'text-amber-500',
      border: 'border-amber-500/50',
      hoverBg: 'hover:bg-amber-500/10',
      selectedBg: 'bg-amber-500/10',
      selectedShadow: 'shadow-lg shadow-amber-500/40',
    },
  },
}

// Fallback only — Patron is not selectable in the upgrade modal, but existing
// Patron subscribers may extend, and we need metadata to render the receipt.
const PATRON_FALLBACK: TierMetadata = {
  tierId: 4,
  name: 'Patron',
  tagline: 'For teams, funds & institutions',
  monthlyUSD: null,
  logo: logoPatron,
  colors: {
    text: 'text-purple-400',
    border: 'border-purple-400/50',
    hoverBg: 'hover:bg-purple-400/10',
    selectedBg: 'bg-purple-400/10',
    selectedShadow: 'shadow-lg shadow-purple-400/40',
  },
}

// Tier IDs that appear as selectable plans in the upgrade modal.
export const MODAL_TIERS: number[] = [1, 2, 3]

export const getTierMetadata = (tierId: number): TierMetadata => {
  return TIER_METADATA_INTERNAL[tierId] ?? PATRON_FALLBACK
}
