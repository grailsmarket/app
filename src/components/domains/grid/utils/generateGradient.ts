import {
  PREMIUM,
  REGISTERED,
  UNREGISTERED,
} from '@/app/constants/domains/registrationStatuses'
import { getRegistrationStatus } from '@/app/utils/getRegistrationStatus'

// expire time must be in seconds
export const generateGradient = (expireTime: number) => {
  const registrationStatus = getRegistrationStatus(expireTime)

  if (registrationStatus === REGISTERED) return 'gradient-blue'

  if (registrationStatus === PREMIUM) return 'gradient-purple-1'

  if (registrationStatus === UNREGISTERED) return 'gradient-purple-2'

  return 'gradient-blue'
}
