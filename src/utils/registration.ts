import { DAY_IN_SECONDS } from '@/constants/time'
import type { TimeUnit, NameRegistrationEntry } from '@/types/registration'

export const getSecondsPerUnit = (unit: TimeUnit): number => {
  switch (unit) {
    case 'days':
      return DAY_IN_SECONDS
    case 'weeks':
      return DAY_IN_SECONDS * 7
    case 'months':
      return DAY_IN_SECONDS * 30
    case 'years':
      return DAY_IN_SECONDS * 365
    case 'custom':
      return 0
    default:
      return DAY_IN_SECONDS * 365
  }
}

export const computeDurationForEntry = (
  entry: NameRegistrationEntry,
  baseQuantity: number,
  baseTimeUnit: TimeUnit,
  baseCustomDuration: number
): number | null => {
  const unit = entry.timeUnit ?? baseTimeUnit
  const qty = entry.quantity ?? baseQuantity
  const custom = entry.customDuration ?? baseCustomDuration

  if (unit === 'custom') {
    if (!custom || custom === 0) return null
    return custom > 0 ? custom : null
  } else {
    return qty * getSecondsPerUnit(unit)
  }
}
