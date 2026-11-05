import { DomainRegistrationDetails, RegistrationStatus } from '@/types/domains'
import { PREMIUM, REGISTERED, UNREGISTERED, GRACE_PERIOD, UNKNOWN } from '../constants/domains/registrationStatuses'
import { DAY_IN_SECONDS } from '../constants/time'

export const PREMIUM_PERIOD = 21 * DAY_IN_SECONDS

export const getGracePeriod = (version: number) => (version === 2 ? 28 : 90) * DAY_IN_SECONDS

export const getRegistrationDates = (domain: DomainRegistrationDetails) => {
  const expiryTime = domain.expiry_date ? Date.parse(domain.expiry_date) : NaN
  const graceEndsAt =
    domain.grace_ends_at !== undefined
      ? domain.grace_ends_at
      : Number.isFinite(expiryTime)
        ? new Date(expiryTime + getGracePeriod(domain.version) * 1000).toISOString()
        : null
  const premiumEndsAt =
    domain.premium_ends_at !== undefined
      ? domain.premium_ends_at
      : graceEndsAt
        ? new Date(Date.parse(graceEndsAt) + PREMIUM_PERIOD * 1000).toISOString()
        : null

  return { graceEndsAt, premiumEndsAt }
}

export const getRegistrationStatus = (domain: DomainRegistrationDetails): RegistrationStatus => {
  switch (domain.registration_status) {
    case 'registered':
      return REGISTERED
    case 'grace':
      return GRACE_PERIOD
    case 'premium':
      return PREMIUM
    case 'available':
      return UNREGISTERED
  }

  if (!domain.expiry_date) return UNREGISTERED

  const expiryTime = Date.parse(domain.expiry_date)
  if (!Number.isFinite(expiryTime)) return UNKNOWN

  const now = Date.now()
  const { graceEndsAt, premiumEndsAt } = getRegistrationDates(domain)

  if (now < expiryTime) return REGISTERED
  if (graceEndsAt && now < Date.parse(graceEndsAt)) return GRACE_PERIOD
  if (premiumEndsAt && now < Date.parse(premiumEndsAt)) return PREMIUM

  return UNREGISTERED
}

export const getSpecialRegistrationStatus = (domain: DomainRegistrationDetails): RegistrationStatus | null => {
  const specialRegistrationStatuses = [GRACE_PERIOD, PREMIUM] as RegistrationStatus[]
  const status = getRegistrationStatus(domain)

  return specialRegistrationStatuses.includes(status) ? status : null
}
