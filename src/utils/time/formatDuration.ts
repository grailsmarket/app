const DAY = 86400
const MONTH = DAY * 30
const YEAR = DAY * 365

const UNITS: [number, string][] = [
  [YEAR, 'yr'],
  [MONTH, 'mo'],
  [DAY, 'd'],
]

export const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return '\u2014'

  const parts: string[] = []
  let remaining = seconds

  for (const [size, label] of UNITS) {
    const n = Math.floor(remaining / size)
    if (n > 0) {
      parts.push(`${n}${label}`)
      remaining -= n * size
    }
  }

  return parts.length > 0 ? parts.join(', ') : '1d'
}
