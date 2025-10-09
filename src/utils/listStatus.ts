import { GRACE_PERIOD, PREMIUM, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'

export const formatListStatus = (expire_time: number) => {
  return (
    [PREMIUM, GRACE_PERIOD].includes(getRegistrationStatus(expire_time) || '') && getRegistrationStatus(expire_time)
  )
}

export const hasRegistrationPrice = (expire_time: number) => {
  return [UNREGISTERED, PREMIUM].includes(getRegistrationStatus(expire_time) || '')
}
