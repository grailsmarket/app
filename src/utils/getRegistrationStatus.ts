import { PREMIUM, REGISTERED, UNREGISTERED, GRACE_PERIOD } from '../constants/domains/registrationStatuses'
import { DAY_IN_SECONDS } from '../constants/time'

// expireTime must be in seconds
export const getRegistrationStatus = (expireTime: number | null | undefined) => {
  if (!expireTime) return UNREGISTERED

  const now = new Date().getTime() / 1000
  const timeSinceExpiry = now - expireTime

  if (timeSinceExpiry < 0) return REGISTERED

  if (timeSinceExpiry < DAY_IN_SECONDS * 90) return GRACE_PERIOD

  if (timeSinceExpiry >= DAY_IN_SECONDS * 90 && timeSinceExpiry < DAY_IN_SECONDS * 111) return PREMIUM

  if (timeSinceExpiry > DAY_IN_SECONDS * 111) return UNREGISTERED
}

export const getSpecialRegistrationStatus = (expireTime: number | null | undefined) => {
  const specialRegistrationStatuses = [GRACE_PERIOD, PREMIUM]
  const status = getRegistrationStatus(expireTime) as string

  return specialRegistrationStatuses.includes(status) ? status : null
}
