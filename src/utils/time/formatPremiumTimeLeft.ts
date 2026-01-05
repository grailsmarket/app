import { DAY_IN_SECONDS, ONE_HOUR, ONE_MINUTE } from '@/constants/time'

const PREMIUM_PERIOD_DAYS = 111

/**
 * Calculates the time remaining in a domain's temporary premium period.
 * Premium period is 111 days after the expiry date.
 * Returns the largest time unit (days > hours > minutes > seconds).
 *
 * @param expiryDate - The domain's expiry date as ISO string
 * @returns Formatted string like "10d", "5h", "30m", "45s" or null if premium has ended
 */
export const formatPremiumTimeLeft = (expiryDate: string): string | null => {
  const expiryTime = new Date(expiryDate).getTime()
  const premiumEndTime = expiryTime + PREMIUM_PERIOD_DAYS * DAY_IN_SECONDS * 1000
  const now = Date.now()

  const remainingMs = premiumEndTime - now

  if (remainingMs <= 0) {
    return null
  }

  const remainingSeconds = Math.floor(remainingMs / 1000)

  // Days
  if (remainingSeconds >= DAY_IN_SECONDS) {
    const days = Math.floor(remainingSeconds / DAY_IN_SECONDS)
    return `${days}d`
  }

  // Hours
  if (remainingSeconds >= ONE_HOUR) {
    const hours = Math.floor(remainingSeconds / ONE_HOUR)
    return `${hours}h`
  }

  // Minutes
  if (remainingSeconds >= ONE_MINUTE) {
    const minutes = Math.floor(remainingSeconds / ONE_MINUTE)
    return `${minutes}m`
  }

  // Seconds
  return `${remainingSeconds}s`
}
