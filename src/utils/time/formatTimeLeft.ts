import { DAY_IN_SECONDS, ONE_HOUR, ONE_MINUTE } from '@/constants/time'

const PREMIUM_PERIOD_DAYS = 111
const GRACE_PERIOD_DAYS = 90

export const formatTimeLeft = (expiryDate: string, type: 'premium' | 'grace' = 'premium'): string | null => {
  const expiryTime = new Date(expiryDate).getTime()
  const timeToAdd = (type === 'premium' ? PREMIUM_PERIOD_DAYS : GRACE_PERIOD_DAYS) * DAY_IN_SECONDS * 1000
  const endTime = expiryTime + timeToAdd
  const now = Date.now()

  const remainingMs = endTime - now

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
