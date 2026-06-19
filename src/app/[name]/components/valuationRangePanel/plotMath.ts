import { heatBellSamples } from '@/utils/valuation/plotMath'
import type { PriceScale } from './types'

// Runtime-agnostic axis/heat math is shared with the OG share-image route; the
// panel re-exports it so local imports stay '@/.../valuationRangePanel/plotMath'.
export { OUTLIER_MULT, computeAxisMax, niceStep, computeTicks } from '@/utils/valuation/plotMath'

const PRIMARY = 'var(--color-primary)'

/** Linear price axis from 0 to axisMax, with fraction/percent helpers. */
export function createPriceScale(axisMax: number): PriceScale {
  const toFrac = (price: number) => Math.max(0, Math.min(1, price / axisMax))
  const fromFrac = (frac: number) => frac * axisMax
  const xPct = (price: number) => toFrac(price) * 100
  return { axisMax, toFrac, fromFrac, xPct }
}

/**
 * Soft "heat" gradient across the price axis for the live panel. Maps the shared
 * Gaussian bell samples to `color-mix` stops (the OG route maps the same samples
 * to rgba for Satori).
 */
export function buildHeatGradient(
  lowFrac: number,
  estFrac: number,
  highFrac: number,
  direction: 'to right' | 'to top' = 'to right'
): string {
  const pct = (f: number) => (f * 100).toFixed(2)
  const samples = heatBellSamples(lowFrac, estFrac, highFrac)
  const stops = [
    'transparent 0%',
    `transparent ${pct(lowFrac)}%`,
    ...samples.map(
      (s) => `color-mix(in srgb, ${PRIMARY} ${(s.opacity * 92).toFixed(1)}%, transparent) ${pct(s.frac)}%`
    ),
    `transparent ${pct(highFrac)}%`,
    'transparent 100%',
  ]
  return `linear-gradient(${direction}, ${stops.join(', ')})`
}
