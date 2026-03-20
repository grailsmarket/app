const DAY = 86400
const YEAR = DAY * 365
const MONTH = DAY * 30
const WEEK = DAY * 7

export const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return '\u2014'

  if (seconds >= YEAR && seconds % YEAR === 0) {
    const n = seconds / YEAR
    return `${n} year${n !== 1 ? 's' : ''}`
  }
  if (seconds >= MONTH && seconds % MONTH === 0) {
    const n = seconds / MONTH
    return `${n} month${n !== 1 ? 's' : ''}`
  }
  if (seconds >= WEEK && seconds % WEEK === 0) {
    const n = seconds / WEEK
    return `${n} week${n !== 1 ? 's' : ''}`
  }
  const n = Math.max(1, Math.round(seconds / DAY))
  return `${n} day${n !== 1 ? 's' : ''}`
}
