const DAY = 86400
const YEAR = DAY * 365
const MONTH = DAY * 30
const WEEK = DAY * 7

const UNITS: [number, string, number?][] = [
  [YEAR, 'yr'],
  [MONTH, 'mo', 11],
  [WEEK, 'wk'],
  [DAY, 'd'],
]

export const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return '\u2014'

  const parts: string[] = []
  let remaining = seconds

  for (const [size, label, max] of UNITS) {
    let n = Math.floor(remaining / size)
    if (max) n = Math.min(n, max)
    if (n > 0) {
      parts.push(`${n}${label}`)
      remaining -= n * size
    }
  }

  return parts.length > 0 ? parts.join(', ') : '1d'
}
