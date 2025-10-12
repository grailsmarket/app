import { RegistrationStatus } from '@/types/domains'
import { PREMIUM, REGISTERED, UNREGISTERED, GRACE_PERIOD } from '../constants/domains/registrationStatuses'
import { DAY_IN_SECONDS } from '../constants/time'
// expireTime must be in seconds
export const getRegistrationStatus = (expiryDate: string | null): RegistrationStatus => {
  if (!expiryDate) return UNREGISTERED

  const expireTime = new Date(expiryDate).getTime() / 1000
  const now = new Date().getTime() / 1000
  const timeSinceExpiry = now - expireTime

  if (timeSinceExpiry < 0) return REGISTERED

  if (timeSinceExpiry < DAY_IN_SECONDS * 90) return GRACE_PERIOD

  if (timeSinceExpiry >= DAY_IN_SECONDS * 90 && timeSinceExpiry < DAY_IN_SECONDS * 111) return PREMIUM

  if (timeSinceExpiry > DAY_IN_SECONDS * 111) return UNREGISTERED

  return UNREGISTERED
}

export const getSpecialRegistrationStatus = (expiryDate: string): RegistrationStatus | null => {
  const specialRegistrationStatuses = [GRACE_PERIOD, PREMIUM] as RegistrationStatus[]
  const status = getRegistrationStatus(expiryDate)

  return specialRegistrationStatuses.includes(status) ? status : null
}
