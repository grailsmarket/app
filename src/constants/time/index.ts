export const ONE_MINUTE_MILLISECONDS = 60 * 1000 // in ms
export const ONE_MINUTE = 60 // in s
export const ONE_HOUR = 60 * ONE_MINUTE // in s
export const DAY_IN_SECONDS = 24 * ONE_HOUR // in s
export const WEEK_IN_SECONDS = DAY_IN_SECONDS * 7 // in s
export const MONTH_IN_SECONDS = DAY_IN_SECONDS * 30 // in s
export const YEAR_IN_SECONDS = 31556952 // in s

export const MARKET_ANALYTICS_TIME_RANGE = {
  'All Time': {
    range: 12,
    unit: 'week',
  },
  '1Y': {
    range: 4,
    unit: 'week',
  },
  '1M': {
    range: 2,
    unit: 'day',
  },
  '1W': {
    range: 1,
    unit: 'day',
  },
  '1D': {
    range: 1,
    unit: 'hour',
  },
}
