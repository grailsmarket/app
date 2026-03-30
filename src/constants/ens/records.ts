import XLogo from 'public/logos/x.svg'
import GithubLogo from 'public/logos/github.svg'
import TelegramLogo from 'public/logos/telegram.svg'
import DiscordLogo from 'public/logos/discord.svg'

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

export const SOCIAL_RECORDS = [
  { key: 'com.twitter', label: 'Twitter / X', icon: XLogo, placeholder: 'username' },
  { key: 'com.github', label: 'GitHub', icon: GithubLogo, placeholder: 'username' },
  { key: 'org.telegram', label: 'Telegram', icon: TelegramLogo, placeholder: 'username' },
  { key: 'com.discord', label: 'Discord', icon: DiscordLogo, placeholder: 'username' },
] as const

export const ADDRESS_LABELS: Record<string, string> = {
  btc: 'BTC',
  // sol: 'SOL',
  // doge: 'DOGE',
}
