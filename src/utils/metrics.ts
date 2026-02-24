export const BAR_STEPS = 12

export function toSteppedPercent(value: number, maxValue: number, steps = BAR_STEPS): number {
  if (value <= 0 || maxValue <= 0) return 0
  const normalized = Math.min(value / maxValue, 1)
  // Ease-out curve to avoid a strictly linear visual scale.
  const eased = 1 - Math.pow(1 - normalized, 1.8)
  const stepped = Math.ceil(eased * steps) / steps
  return stepped * 100
}