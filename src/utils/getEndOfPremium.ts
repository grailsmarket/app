import { getGracePeriod, PREMIUM_PERIOD } from './getRegistrationStatus'

export const getEndOfPremium = (expireTime: number, version: number) => {
  return expireTime + getGracePeriod(version) + PREMIUM_PERIOD
}
