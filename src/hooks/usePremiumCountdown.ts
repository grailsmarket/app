import { useState, useEffect, useCallback } from 'react'
import PremiumPriceOracle from '@/utils/web3/premiumPriceOracle'
import { DAY_IN_SECONDS, ONE_HOUR } from '@/constants/time'

const PREMIUM_PERIOD_DAYS = 111

interface UsePremiumCountdownResult {
  premiumPrice: number
  timeLeftString: string | null
  isUnderOneHour: boolean
  isPremium: boolean
}

export const usePremiumCountdown = (expiryDate: string | null): UsePremiumCountdownResult => {
  const [tick, setTick] = useState(0)

  const calculateValues = useCallback(() => {
    if (!expiryDate) {
      return {
        premiumPrice: 0,
        timeLeftString: null,
        isUnderOneHour: false,
        isPremium: false,
        remainingSeconds: 0,
      }
    }

    const expiryTime = new Date(expiryDate).getTime()
    const premiumEndTime = expiryTime + PREMIUM_PERIOD_DAYS * DAY_IN_SECONDS * 1000
    const now = Date.now()
    const remainingMs = premiumEndTime - now

    if (remainingMs <= 0) {
      return {
        premiumPrice: 0,
        timeLeftString: null,
        isUnderOneHour: false,
        isPremium: false,
        remainingSeconds: 0,
      }
    }

    const remainingSeconds = Math.floor(remainingMs / 1000)
    const isUnderOneHour = remainingSeconds < ONE_HOUR

    // Calculate premium price
    const premiumPriceOracle = new PremiumPriceOracle(expiryTime / 1000)
    const premiumPrice = premiumPriceOracle.getOptimalPrecisionPremiumAmount(now / 1000)

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
      isPremium: true,
      remainingSeconds,
    }
  }, [expiryDate])

  const values = calculateValues()

  useEffect(() => {
    // Only set up interval if under one hour and is premium
    if (!values.isPremium || !values.isUnderOneHour) {
      return
    }

    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [values.isPremium, values.isUnderOneHour])

  // Re-calculate on each tick
  const currentValues = tick >= 0 ? calculateValues() : values

  return {
    premiumPrice: currentValues.premiumPrice,
    timeLeftString: currentValues.timeLeftString,
    isUnderOneHour: currentValues.isUnderOneHour,
    isPremium: currentValues.isPremium,
  }
}
