import type { PriceScale } from '@/types/valuation'

// Comps priced above this multiple of the high estimate are treated as outliers:
// they don't stretch the axis and instead pin to the far right edge.
export const OUTLIER_MULT = 3

const HEAT_EDGE_OFFSET = 0.05 // opacity sitting at the range edges (low/high)
const HEAT_SIGMA_K = 2.5 // the range edge sits this many sigma from the estimate

/** Axis max hugs the data: highest of (high estimate, top comp) + 5%. */
export function computeAxisMax(high: number, maxCompPrice: number): number {
  return Math.max(high, maxCompPrice, 1e-6) * 1.05
}

/** Round up to a "nice" number on a fine ladder (avoids snapping 2.3 -> 5). */
export function niceStep(value: number): number {
  if (value <= 0) return 1
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const steps = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]
  const step = steps.find((s) => normalized <= s + 1e-9) ?? 10
  return step * magnitude
}

/** Evenly-spaced axis ticks from 0 to axisMax on a "nice" step. */
export function computeTicks(axisMax: number): number[] {
  const tickStep = niceStep(axisMax / 5)
  return Array.from({ length: Math.floor(axisMax / tickStep + 1e-9) + 1 }, (_, i) => i * tickStep)
}

export type HeatSample = { frac: number; opacity: number }

/**
 * Samples a soft "heat" curve across the price axis in fraction space (0..1), so
 * it's agnostic to scaling and to how the caller renders color. Opacity follows a
 * Gaussian bell centred on the estimate, offset to HEAT_EDGE_OFFSET at the range
 * edges; samples outside [lowFrac, highFrac] are 0. Callers wrap the samples with
 * transparent endpoints and map `opacity` to their own color representation
 * (color-mix in the panel, rgba in the OG route).
 */
export function heatBellSamples(lowFrac: number, estFrac: number, highFrac: number, stops = 32): HeatSample[] {
  const span = Math.max(highFrac - lowFrac, 0)
  const sigmaLeft = (estFrac - lowFrac) / HEAT_SIGMA_K
  const sigmaRight = (highFrac - estFrac) / HEAT_SIGMA_K
  const gEdge = Math.exp(-0.5 * HEAT_SIGMA_K * HEAT_SIGMA_K)

  const bell = (f: number) => {
    const d = f - estFrac
    const sigma = d <= 0 ? sigmaLeft : sigmaRight
    if (sigma <= 0) return 1
    const g = Math.exp(-0.5 * (d / sigma) ** 2)
    const normalized = Math.max(0, (g - gEdge) / (1 - gEdge))
    return HEAT_EDGE_OFFSET + (1 - HEAT_EDGE_OFFSET) * normalized
  }

  const samples: HeatSample[] = []
  for (let i = 0; i <= stops; i++) {
    const frac = lowFrac + (span * i) / stops
    const opacity = frac <= lowFrac || frac >= highFrac ? 0 : bell(frac)
    samples.push({ frac, opacity })
  }
  return samples
}

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
