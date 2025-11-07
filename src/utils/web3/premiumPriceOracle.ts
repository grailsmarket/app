import { DAY_IN_SECONDS, ONE_HOUR, ONE_MINUTE } from '../../constants/time'

const FACTOR = 0.5

// All the dates and time parameters are parsed & returned in seconds (not milliseconds)
export default class PremiumPriceOracle {
  startingPremiumInUsd: number
  totalDays: number
  lastValue: number
  releasedDate: number
  zeroPremiumDate: number
  diff: number
  rate: number
  diffInHour: number
  hourlyRate: number
  diffInMinutes: number
  minutelyRate: number
  totalMinutes: number

  constructor(expiryDate: number) {
    this.startingPremiumInUsd = 100000000
    this.totalDays = 21
    this.lastValue = this.startingPremiumInUsd * FACTOR ** this.totalDays
    this.releasedDate = expiryDate + DAY_IN_SECONDS * 90
    this.zeroPremiumDate = this.releasedDate + this.totalDays * DAY_IN_SECONDS
    this.diff = this.zeroPremiumDate - this.releasedDate
    this.rate = this.startingPremiumInUsd / this.diff
    this.diffInHour = (this.zeroPremiumDate - this.releasedDate) / ONE_HOUR
    this.hourlyRate = this.startingPremiumInUsd / this.diffInHour
    this.totalMinutes = this.totalDays * 24 * 60
    this.diffInMinutes = (this.zeroPremiumDate - this.releasedDate) / ONE_MINUTE
    this.minutelyRate = this.startingPremiumInUsd / this.diffInMinutes
  }

  getDaysPast(currentDate: number) {
    return Math.floor((currentDate - this.releasedDate) / DAY_IN_SECONDS)
  }

  getHoursPast(currentDate: number) {
    return Math.floor((currentDate - this.releasedDate) / ONE_HOUR)
  }

  getMinutesPast(currentDate: number) {
    return Math.floor((currentDate - this.releasedDate) / ONE_MINUTE)
  }

  getDaysRemaining(currentDate: number) {
    return this.totalDays - this.getDaysPast(currentDate)
  }

  getHoursRemaining(currentDate: number) {
    return this.totalDays * 24 - this.getHoursPast(currentDate)
  }

  getMinutesRemaining(currentDate: number) {
    return this.totalMinutes - this.getMinutesPast(currentDate)
  }

  getTargetDateByAmount(amount: number) {
    let daysPast
    if (amount < this.lastValue) {
      daysPast = this.totalDays
    } else {
      daysPast = Math.log((amount + this.lastValue) / this.startingPremiumInUsd) / Math.log(FACTOR)
    }
    const r = this.releasedDate + daysPast * DAY_IN_SECONDS
    return r
  }

  getTargetAmountByDaysPast(daysPast: number) {
    const premium = this.startingPremiumInUsd * FACTOR ** daysPast
    if (premium >= this.lastValue) {
      return premium
    } else {
      return 0
    }
  }

  getAmountByDateRange(currentDate: number) {
    const daysPast = this.getDaysPast(currentDate) * 24
    return this.getTargetAmountByDaysPast(daysPast)
  }

  /**
   * Calculate premium price with high precision using minutes instead of just days
   * This provides much more accurate pricing especially in the early hours/days of premium period
   */
  getPrecisePremiumAmount(currentDate: number): number {
    // If we haven't reached the premium period yet, return 0
    if (currentDate < this.releasedDate) {
      return 0
    }

    // If we're past the premium period, return 0
    if (currentDate >= this.zeroPremiumDate) {
      return 0
    }

    // Calculate exact minutes passed since premium started
    const minutesPast = this.getMinutesPast(currentDate)

    // Convert minutes to fractional days for the exponential decay formula
    const fractionalDaysPast = minutesPast / (24 * 60)

    // Apply exponential decay: startingPrice * (factor ^ daysPast)
    const premium = this.startingPremiumInUsd * FACTOR ** fractionalDaysPast

    // Ensure we don't go below the minimum value
    if (premium < this.lastValue) {
      return 0
    }

    return premium
  }

  /**
   * Calculate premium with hour-level precision (fallback if minute precision is too granular)
   */
  getHourlyPrecisionPremiumAmount(currentDate: number): number {
    if (currentDate < this.releasedDate) {
      return 0
    }

    if (currentDate >= this.zeroPremiumDate) {
      return 0
    }

    const hoursPast = this.getHoursPast(currentDate)
    const fractionalDaysPast = hoursPast / 24

    const premium = this.startingPremiumInUsd * FACTOR ** fractionalDaysPast
    console.log('premium', premium)

    if (premium < this.lastValue) {
      return 0
    }

    return premium
  }

  /**
   * Get premium amount with the highest available precision
   * Automatically chooses between minute, hour, or day precision based on accuracy needs
   */
  getOptimalPrecisionPremiumAmount(currentDate: number): number {
    // For the first few days, use minute precision for maximum accuracy
    return this.getPrecisePremiumAmount(currentDate)
  }
}
