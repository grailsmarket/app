import { DomainRegistrationDetails } from '@/types/domains'
import { PREMIUM, REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { getRegistrationStatus } from './getRegistrationStatus'

// expire time must be in seconds
export const generateNameGradient = (domain: DomainRegistrationDetails) => {
  const registrationStatus = getRegistrationStatus(domain)

  if (registrationStatus === REGISTERED) return 'gradient-blue'

  if (registrationStatus === PREMIUM) return 'gradient-purple'

  if (registrationStatus === UNREGISTERED) return 'gradient-gray'

  return 'gradient-blue'
}
