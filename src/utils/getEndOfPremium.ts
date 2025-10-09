import { DAY_IN_SECONDS } from '../constants/time'

export const getEndOfPremium = (expire_time: number) => {
  const endOfPremium = expire_time + 111 * DAY_IN_SECONDS
  return endOfPremium
}
