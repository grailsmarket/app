import type { MarketplaceType, SeaportCancelEvent, SeaportProgressEvent } from '@/lib/seaport/seaportClient'

// Shared by the listing and offer modals: what the Seaport client reported so far, folded into state.

export const KEEP_OPEN_HINT = 'Keep this window open until the transaction is confirmed.'
export const SIGN_FREE_MESSAGE = 'Please sign in your wallet. Signing costs no gas.'

export const MARKETPLACE_NAMES: Record<MarketplaceType, string> = { grails: 'Grails', opensea: 'OpenSea' }

/** "Grails and OpenSea", "Grails" or "OpenSea": Grails first, as the app writes it. */
export const marketplaceLabel = (marketplaces: MarketplaceType[], joiner: 'and' | 'or' = 'and') => {
  const hasGrails = marketplaces.includes('grails')
  const hasOpenSea = marketplaces.includes('opensea')
  if (hasGrails && hasOpenSea) return `Grails ${joiner} OpenSea`
  return hasOpenSea ? 'OpenSea' : 'Grails'
}

/** The order the Seaport client works through the picked marketplaces: OpenSea first when both are picked. */
export const getRunOrder = (marketplaces: MarketplaceType[]): MarketplaceType[] =>
  marketplaces.includes('opensea') && marketplaces.includes('grails') ? ['opensea', 'grails'] : [...marketplaces]

export type MarketplacePhase = 'upcoming' | 'checking' | 'approving' | 'signing' | 'done'

export interface MarketplaceProgress {
  phase: MarketplacePhase
  approvals: number | null
  approvalIndex: number
  approvalHashes: string[]
  approvalSent: boolean
}

export interface SeaportRun {
  markets: Partial<Record<MarketplaceType, MarketplaceProgress>>
  publish: 'upcoming' | 'active' | 'done'
  /** Whether each marketplace's API save went through. */
  published: Partial<Record<MarketplaceType, boolean>>
}

export const EMPTY_RUN: SeaportRun = { markets: {}, publish: 'upcoming', published: {} }

const EMPTY_MARKET: MarketplaceProgress = {
  phase: 'upcoming',
  approvals: null,
  approvalIndex: 0,
  approvalHashes: [],
  approvalSent: false,
}

export const getMarketProgress = (run: SeaportRun, marketplace: MarketplaceType) =>
  run.markets[marketplace] ?? EMPTY_MARKET

export const applySeaportProgress = (run: SeaportRun, event: SeaportProgressEvent): SeaportRun => {
  if (event.type === 'publishing') return { ...run, publish: 'active' }
  if (event.type === 'published') return { ...run, published: { ...run.published, [event.marketplace]: event.ok } }

  const market = getMarketProgress(run, event.marketplace)
  let next: MarketplaceProgress

  switch (event.type) {
    case 'checking':
      next = { ...market, phase: 'checking' }
      break
    case 'approvals':
      next = { ...market, approvals: event.count }
      break
    case 'approval-prompt':
      next = { ...market, phase: 'approving', approvalIndex: event.index, approvalSent: false }
      break
    case 'approval-sent': {
      const approvalHashes = [...market.approvalHashes]
      approvalHashes[event.index] = event.hash
      next = { ...market, approvalHashes, approvalSent: true }
      break
    }
    case 'signing':
      next = { ...market, phase: 'signing' }
      break
    case 'signed':
      next = { ...market, phase: 'done' }
      break
  }

  return { ...run, markets: { ...run.markets, [event.marketplace]: next } }
}

/** The marketplace the client is working on, if any. */
export const getCurrentMarketplace = (run: SeaportRun, order: MarketplaceType[]) =>
  order.find((marketplace) => {
    const { phase } = getMarketProgress(run, marketplace)
    return phase === 'checking' || phase === 'approving' || phase === 'signing'
  })

export type CancelPhase = 'idle' | 'api' | 'prompt' | 'sent' | 'update'

export interface CancelRun {
  phase: CancelPhase
  hash: string | null
}

export const IDLE_CANCEL: CancelRun = { phase: 'idle', hash: null }

export const applyCancelProgress = (run: CancelRun, event: SeaportCancelEvent): CancelRun => {
  switch (event.type) {
    case 'cancel-api':
      return { ...run, phase: 'api' }
    case 'cancel-prompt':
      return { ...run, phase: 'prompt' }
    case 'cancel-sent':
      return { phase: 'sent', hash: event.hash }
    case 'cancel-update':
      return { ...run, phase: 'update' }
  }
}

/** The onchain cancel has started, so any Grails part before it went through. */
export const isOnchainCancelStarted = (run: CancelRun) =>
  run.phase === 'prompt' || run.phase === 'sent' || run.phase === 'update'

/**
 * One readable line for the danger Notice, with the full text for its details.
 * viem errors carry a shortMessage; otherwise the first line of the message is the readable part.
 */
export const getErrorParts = (err: unknown, fallback: string): { message: string; details: string | null } => {
  const error = err as { shortMessage?: unknown; message?: unknown } | string | null | undefined
  const full =
    typeof error === 'string' ? error : typeof error?.message === 'string' && error.message ? error.message : fallback
  const short =
    typeof error === 'object' && typeof error?.shortMessage === 'string' && error.shortMessage
      ? error.shortMessage
      : full.split('\n')[0].trim() || fallback

  return { message: short, details: full !== short ? full : null }
}

/** "a.eth", "a.eth and b.eth", "a.eth, b.eth and c.eth". */
export const joinNames = (names: string[]) =>
  names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

/** Whole days from now until `timestamp` (seconds): "30 days", "1 day". */
export const formatDaysUntil = (timestamp: number, now = Math.floor(Date.now() / 1000)) => {
  const days = Math.max(1, Math.round((timestamp - now) / 86400))
  return `${days} ${days === 1 ? 'day' : 'days'}`
}
