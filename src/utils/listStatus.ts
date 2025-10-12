import { GRACE_PERIOD, PREMIUM, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'

export const formatListStatus = (expiry_date: string | null) => {
  return (
    [PREMIUM, GRACE_PERIOD].includes(getRegistrationStatus(expiry_date) || '') && getRegistrationStatus(expiry_date)
  )
}

export const hasRegistrationPrice = (expiry_date: string | null) => {
  return [UNREGISTERED, PREMIUM].includes(getRegistrationStatus(expiry_date) || '')
}
