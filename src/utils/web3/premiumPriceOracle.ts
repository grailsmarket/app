import { DAY_IN_SECONDS, ONE_HOUR } from '../../constants/time'

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
  }

  getDaysPast(currentDate: number) {
    return Math.floor((currentDate - this.releasedDate) / DAY_IN_SECONDS)
  }

  getHoursPast(currentDate: number) {
    return Math.floor((currentDate - this.releasedDate) / ONE_HOUR)
  }

  getDaysRemaining(currentDate: number) {
    return this.totalDays - this.getDaysPast(currentDate)
  }

  getHoursRemaining(currentDate: number) {
    return this.totalDays * 24 - this.getHoursPast(currentDate)
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
    const daysPast = this.getDaysPast(currentDate)
    return this.getTargetAmountByDaysPast(daysPast)
  }
}
