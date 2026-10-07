import { RegistrationStatus } from '@/types/domains'
import { PREMIUM, REGISTERED, UNREGISTERED, GRACE_PERIOD } from '../constants/domains/registrationStatuses'
import { DAY_IN_SECONDS } from '../constants/time'

export const PREMIUM_PERIOD = 21 * DAY_IN_SECONDS

export const getGracePeriod = (ensVersion?: number | null) => (ensVersion === 2 ? 28 : 90) * DAY_IN_SECONDS

export const getGraceEnd = (expiryDate: string | null | undefined, ensVersion?: number | null) =>
  new Date(new Date(expiryDate || '').getTime() + getGracePeriod(ensVersion) * 1000).toISOString()

// expireTime must be in seconds
export const getRegistrationStatus = (expiryDate: string | null, ensVersion?: number | null): RegistrationStatus => {
  if (!expiryDate) return UNREGISTERED

  const expireTime = new Date(expiryDate).getTime() / 1000
  const now = new Date().getTime() / 1000
  const timeSinceExpiry = now - expireTime
  const gracePeriod = getGracePeriod(ensVersion)

  if (timeSinceExpiry < 0) return REGISTERED

  if (timeSinceExpiry < gracePeriod) return GRACE_PERIOD

  if (timeSinceExpiry < gracePeriod + PREMIUM_PERIOD) return PREMIUM

  return UNREGISTERED
}

export const getSpecialRegistrationStatus = (expiryDate: string): RegistrationStatus | null => {
  const specialRegistrationStatuses = [GRACE_PERIOD, PREMIUM] as RegistrationStatus[]
  const status = getRegistrationStatus(expiryDate)

  return specialRegistrationStatuses.includes(status) ? status : null
}
