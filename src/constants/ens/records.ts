export const TEXT_RECORD_KEYS = [
  'description',
  'status',
  'location',
  'url',
  'email',
  'com.twitter',
  'com.github',
  'org.telegram',
  'com.discord',
  'avatar',
  'header',
] as const

export const ADDRESS_RECORD_KEYS = ['btc'] as const

export const COIN_TYPES: Record<string, number> = {
  btc: 0,
  sol: 501,
  doge: 3,
}
