import { DomainRegistrationDetails } from '@/types/domains'
import { GRACE_PERIOD, PREMIUM, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'

export const formatListStatus = (domain: DomainRegistrationDetails) => {
  return [PREMIUM, GRACE_PERIOD].includes(getRegistrationStatus(domain) || '') && getRegistrationStatus(domain)
}

export const hasRegistrationPrice = (domain: DomainRegistrationDetails) => {
  return [UNREGISTERED, PREMIUM].includes(getRegistrationStatus(domain) || '')
}
