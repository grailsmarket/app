import type { Address } from 'viem'

type BrowserNavigation = {
  currentEntry: NavigationHistoryEntry | null
  entries(): NavigationHistoryEntry[]
}

let historyDestination: string | undefined
export let navigationSequence = 0
const profileAliases = new Map<string, string>()

export function trackProfileNavigation(url: string, type: 'push' | 'replace' | 'traverse') {
  navigationSequence++
  historyDestination = type === 'traverse' ? new URL(url, window.location.href).href : undefined
}

export function enterProfileRoute(pathname: string, address: Address) {
  // An ENS name or list ID can lead to the same wallet as an address link.
  if (pathname.toLowerCase() !== `/profile/${address.toLowerCase()}`) {
    profileAliases.set(pathname, address.toLowerCase())
  }
  return historyDestination === window.location.href
}

export function previousEntryIsProfile(address: Address) {
  const navigation = (window as Window & { navigation?: BrowserNavigation }).navigation
  if (!navigation?.currentEntry) return false

  const previous = navigation.entries()[navigation.currentEntry.index - 1]
  if (!previous?.url) return false

  const { origin, pathname } = new URL(previous.url)
  if (origin !== window.location.origin) return false
  const wallet = address.toLowerCase()
  return pathname.toLowerCase() === `/profile/${wallet}` || profileAliases.get(pathname) === wallet
}
