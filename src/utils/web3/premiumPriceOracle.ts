import { BigNumber } from '@ethersproject/bignumber'
import { DAY_IN_SECONDS, ONE_HOUR, ONE_MINUTE } from '../../constants/time'

const GRACE_PERIOD = 90 * DAY_IN_SECONDS // 90 days in seconds
const TOTAL_DAYS = 21
const PRECISION = BigInt('1000000000000000000') // 1e18
const ONE_DAY_SECONDS = BigInt(DAY_IN_SECONDS)

// Bit constants for fractional premium calculation
// These are 0.5 ^ (n/65536) * 10^18, matching the Solidity contract exactly
const bit1 = BigInt('999989423469314432') // 0.5 ^ 1/65536 * (10 ** 18)
const bit2 = BigInt('999978847050491904') // 0.5 ^ 2/65536 * (10 ** 18)
const bit3 = BigInt('999957694548431104')
const bit4 = BigInt('999915390886613504')
const bit5 = BigInt('999830788931929088')
const bit6 = BigInt('999661606496243712')
const bit7 = BigInt('999323327502650752')
const bit8 = BigInt('998647112890970240')
const bit9 = BigInt('997296056085470080')
const bit10 = BigInt('994599423483633152')
const bit11 = BigInt('989228013193975424')
const bit12 = BigInt('978572062087700096')
const bit13 = BigInt('957603280698573696')
const bit14 = BigInt('917004043204671232')
const bit15 = BigInt('840896415253714560')
const bit16 = BigInt('707106781186547584')

const bits = [bit1, bit2, bit3, bit4, bit5, bit6, bit7, bit8, bit9, bit10, bit11, bit12, bit13, bit14, bit15, bit16]

// All dates and time parameters are parsed & returned in seconds (not milliseconds)
export default class PremiumPriceOracle {
  startPremium: bigint
  endValue: bigint
  expiryDate: number // expiry date in seconds
  releasedDate: number // when premium period starts (expiry + 90 days grace)
  zeroPremiumDate: number // when premium period ends

  constructor(expiryDate: number) {
    // startPremium is $100,000,000 with 18 decimals
    this.startPremium = BigInt('100000000000000000000000000') // 100_000_000 * 1e18
    this.endValue = this.startPremium >> BigInt(TOTAL_DAYS) // startPremium / 2^21
    this.expiryDate = expiryDate
    this.releasedDate = expiryDate + GRACE_PERIOD
    this.zeroPremiumDate = this.releasedDate + TOTAL_DAYS * DAY_IN_SECONDS
  }

  /**
   * Calculate the premium amount in USD with 18 decimal precision
   * Matches the Solidity ExponentialPremiumPriceOracle._premium() function
   * @param currentDate - current timestamp in seconds
   * @returns premium in USD * 1e18 (bigint)
   */
  getPremiumWei(currentDate: number): bigint {
    const expires = this.expiryDate + GRACE_PERIOD

    // If still in grace period or before, no premium
    if (expires > currentDate) {
      return BigInt(0)
    }

    const elapsed = BigNumber.from(Math.floor(currentDate - expires)).toBigInt()
    const premium = this.decayedPremium(this.startPremium, elapsed)

    if (premium >= this.endValue) {
      return premium - this.endValue
    }
    return BigInt(0)
  }

  /**
   * Calculate the decayed premium based on elapsed time
   * Matches the Solidity decayedPremium() function exactly
   * @param startPremium - starting premium with 18 decimals
   * @param elapsed - seconds elapsed since premium period started
   * @returns decayed premium with 18 decimals
   */
  decayedPremium(startPremium: bigint, elapsed: bigint): bigint {
    // daysPast with PRECISION (18 decimals)
    const daysPast = (elapsed * PRECISION) / ONE_DAY_SECONDS
    const intDays = daysPast / PRECISION

    // premium = startPremium >> intDays (divide by 2^intDays)
    let premium = startPremium >> intDays

    // Calculate fractional part of day
    const partDay = daysPast - intDays * PRECISION
    // Convert to 16-bit fraction: (partDay * 2^16) / PRECISION
    const fraction = (partDay * BigInt(65536)) / PRECISION

    // Apply fractional premium decay
    premium = this.addFractionalPremium(fraction, premium)

    return premium
  }

  /**
   * Apply fractional day decay using bit manipulation
   * Matches the Solidity addFractionalPremium() function exactly
   */
  addFractionalPremium(fraction: bigint, premium: bigint): bigint {
    for (let i = 0; i < 16; i++) {
      if ((fraction & (BigInt(1) << BigInt(i))) !== BigInt(0)) {
        premium = (premium * bits[i]) / PRECISION
      }
    }
    return premium
  }

  /**
   * Get premium in USD (as a number, not scaled)
   * @param currentDate - current timestamp in seconds
   * @returns premium in USD
   */
  getPremiumUsd(currentDate: number): number {
    const premiumWei = this.getPremiumWei(currentDate)
    // Convert from 18 decimals to regular number
    return Number(premiumWei) / 1e18
  }

  // Utility methods for remaining time calculations
  getDaysPast(currentDate: number): number {
    if (currentDate < this.releasedDate) return 0
    return Math.floor((currentDate - this.releasedDate) / DAY_IN_SECONDS)
  }

  getHoursPast(currentDate: number): number {
    if (currentDate < this.releasedDate) return 0
    return Math.floor((currentDate - this.releasedDate) / ONE_HOUR)
  }

  getMinutesPast(currentDate: number): number {
    if (currentDate < this.releasedDate) return 0
    return Math.floor((currentDate - this.releasedDate) / ONE_MINUTE)
  }

  getDaysRemaining(currentDate: number): number {
    if (currentDate >= this.zeroPremiumDate) return 0
    if (currentDate < this.releasedDate) return TOTAL_DAYS
    return Math.ceil((this.zeroPremiumDate - currentDate) / DAY_IN_SECONDS)
  }

  getHoursRemaining(currentDate: number): number {
    if (currentDate >= this.zeroPremiumDate) return 0
    if (currentDate < this.releasedDate) return TOTAL_DAYS * 24
    return Math.ceil((this.zeroPremiumDate - currentDate) / ONE_HOUR)
  }

  getMinutesRemaining(currentDate: number): number {
    if (currentDate >= this.zeroPremiumDate) return 0
    if (currentDate < this.releasedDate) return TOTAL_DAYS * 24 * 60
    return Math.ceil((this.zeroPremiumDate - currentDate) / ONE_MINUTE)
  }

  /**
   * Check if the domain is currently in premium period
   */
  isInPremiumPeriod(currentDate: number): boolean {
    return currentDate >= this.releasedDate && currentDate < this.zeroPremiumDate
  }

  /**
   * Check if the domain is still in grace period
   */
  isInGracePeriod(currentDate: number): boolean {
    return currentDate >= this.expiryDate && currentDate < this.releasedDate
  }

  // Legacy method names for backwards compatibility
  getOptimalPrecisionPremiumAmount(currentDate: number): number {
    return this.getPremiumUsd(currentDate)
  }

  getPrecisePremiumAmount(currentDate: number): number {
    return this.getPremiumUsd(currentDate)
  }

  getHourlyPrecisionPremiumAmount(currentDate: number): number {
    return this.getPremiumUsd(currentDate)
  }

  getAmountByDateRange(currentDate: number): number {
    return this.getPremiumUsd(currentDate)
  }

  getTargetAmountByDaysPast(daysPast: number): number {
    if (daysPast >= TOTAL_DAYS) return 0
    const elapsed = BigInt(daysPast * DAY_IN_SECONDS)
    const premium = this.decayedPremium(this.startPremium, elapsed)
    if (premium >= this.endValue) {
      return Number(premium - this.endValue) / 1e18
    }
    return 0
  }

  getTargetDateByAmount(amount: number): number {
    // Binary search to find the date when premium reaches the target amount
    const amountWei = BigInt(Math.floor(amount * 1e18))
    let low = this.releasedDate
    let high = this.zeroPremiumDate

    while (low < high) {
      const mid = Math.floor((low + high) / 2)
      const premiumAtMid = this.getPremiumWei(mid)

      if (premiumAtMid > amountWei) {
        low = mid + 1
      } else {
        high = mid
      }
    }

    return low
  }
}
