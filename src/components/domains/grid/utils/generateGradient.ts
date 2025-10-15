import { PREMIUM, REGISTERED, UNREGISTERED } from '@/constants/domains/registrationStatuses'
import { getRegistrationStatus } from '@/utils/getRegistrationStatus'

// expire time must be in seconds
export const generateGradient = (expireTime: string) => {
  const registrationStatus = getRegistrationStatus(expireTime)

  if (registrationStatus === REGISTERED) return 'gradient-blue'

  if (registrationStatus === PREMIUM) return 'gradient-purple-1'

  if (registrationStatus === UNREGISTERED) return 'gradient-purple-2'

  return 'gradient-blue'
}
