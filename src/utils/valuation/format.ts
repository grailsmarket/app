export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function formatEth(value: number | null): string {
  if (value === null) return 'N/A'
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: value < 0.01 ? 6 : value < 1 ? 4 : 3,
  })} ETH`
}

export function formatEthShort(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: value < 1 ? 3 : value < 10 ? 2 : 1 })
}

export function formatUsd(value: number | null): string {
  if (value === null) return 'N/A'
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

/** Compact search-volume formatting: 1k, 10k, 100k, 1mil, 1.2mil. */
export function formatSearchCount(value: number): string {
  const trim = (n: number) => Number(n.toFixed(1)).toLocaleString()
  if (value >= 1_000_000) return `${trim(value / 1_000_000)}mil`
  if (value >= 1_000) return `${trim(value / 1_000)}k`
  return value.toLocaleString()
}

/** Decimal places appropriate to the axis scale (~2 significant figures). */
function scaleDecimals(axisMax: number): number {
  if (axisMax >= 50) return 0
  if (axisMax >= 5) return 1
  if (axisMax >= 0.1) return 2
  if (axisMax >= 0.01) return 3
  return 4
}

/** Format an ETH value at a precision suited to the scale, with stable decimals. */
export function formatEthAtScale(value: number, axisMax: number): string {
  const decimals = scaleDecimals(axisMax)
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} ETH`
}
