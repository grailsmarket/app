import { useState, useEffect, useCallback } from 'react'
import PremiumPriceOracle from '@/utils/web3/premiumPriceOracle'
import { DAY_IN_SECONDS, ONE_HOUR } from '@/constants/time'

const PREMIUM_PERIOD_DAYS = 111
const GRACE_PERIOD_DAYS = 90

type CountdownType = 'premium' | 'grace' | null

interface UseExpiryCountdownResult {
  premiumPrice: number
  timeLeftString: string | null
  isUnderOneHour: boolean
  isActive: boolean
}

const defaultResult = {
  premiumPrice: 0,
  timeLeftString: null,
  isUnderOneHour: false,
  isActive: false,
}

export const useExpiryCountdown = (expiryDate: string | null, type: CountdownType): UseExpiryCountdownResult => {
  const [tick, setTick] = useState(0)

  const calculateValues = useCallback(() => {
    // If no type or no expiry date, return defaults
    if (!type || !expiryDate) {
      return { ...defaultResult, remainingSeconds: 0 }
    }

    const periodDays = type === 'premium' ? PREMIUM_PERIOD_DAYS : GRACE_PERIOD_DAYS
    const expiryTime = new Date(expiryDate).getTime()
    const endTime = expiryTime + periodDays * DAY_IN_SECONDS * 1000
    const now = Date.now()
    const remainingMs = endTime - now

    if (remainingMs <= 0) {
      return { ...defaultResult, remainingSeconds: 0 }
    }

    const remainingSeconds = Math.floor(remainingMs / 1000)
    const isUnderOneHour = remainingSeconds < ONE_HOUR

    // Only calculate premium price for premium type
    let premiumPrice = 0
    if (type === 'premium') {
      const premiumPriceOracle = new PremiumPriceOracle(expiryTime / 1000)
      premiumPrice = premiumPriceOracle.getOptimalPrecisionPremiumAmount(now / 1000)
    }

    // Format time string
    let timeLeftString: string
    if (isUnderOneHour) {
      const minutes = Math.floor(remainingSeconds / 60)
      const seconds = remainingSeconds % 60
      timeLeftString = `${minutes}m ${seconds}s`
    } else if (remainingSeconds >= DAY_IN_SECONDS) {
      const days = Math.floor(remainingSeconds / DAY_IN_SECONDS)
      const hours = Math.floor((remainingSeconds % DAY_IN_SECONDS) / ONE_HOUR)
      timeLeftString = hours > 0 ? `${days}d ${hours}h` : `${days}d`
    } else {
      const hours = Math.floor(remainingSeconds / ONE_HOUR)
      const minutes = Math.floor((remainingSeconds % ONE_HOUR) / 60)
      timeLeftString = minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
    }

    return {
      premiumPrice,
      timeLeftString,
      isUnderOneHour,
      isActive: true,
      remainingSeconds,
    }
  }, [expiryDate, type])

  const values = calculateValues()

  useEffect(() => {
    // Only set up interval if type is set, is active, and under one hour
    if (!type || !values.isActive || !values.isUnderOneHour) {
      return
    }

    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [type, values.isActive, values.isUnderOneHour])

  // Re-calculate on each tick
  const currentValues = tick >= 0 ? calculateValues() : values

  return {
    premiumPrice: currentValues.premiumPrice,
    timeLeftString: currentValues.timeLeftString,
    isUnderOneHour: currentValues.isUnderOneHour,
    isActive: currentValues.isActive,
  }
}
