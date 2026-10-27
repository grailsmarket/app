import type { TimeUnit } from '@/types/registration'

const DATE_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }

/** "Mar 3, 2028" */
export const formatExpiryDate = (ms: number) => new Date(ms).toLocaleDateString('en-US', DATE_FORMAT)

/** A name's expiry in ms after extending it by `durationSeconds`, or null when its current expiry is unknown. */
export const getNewExpiry = (currentExpirySeconds: number, durationSeconds: bigint | number) =>
  currentExpirySeconds > 0 ? (currentExpirySeconds + Number(durationSeconds)) * 1000 : null

/** "1 year", "6 months", "Until Mar 3, 2029" */
export const formatRenewalDuration = (quantity: number, timeUnit: TimeUnit, customDate: number) => {
  if (timeUnit === 'custom') return customDate ? `Until ${formatExpiryDate(customDate * 1000)}` : null
  const unit = timeUnit.replace(/s$/, '')
  return `${quantity} ${unit}${quantity === 1 ? '' : 's'}`
}

export const pluralize = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`
