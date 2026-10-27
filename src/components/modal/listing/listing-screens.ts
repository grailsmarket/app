import type { TxStep } from '@/components/ui/modal/txSteps'
import type { NameChip } from '@/components/ui/modal/nameChips'
import type { MarketplaceType } from '@/lib/seaport/seaportClient'
import type { ListingStatus } from './createListingModal'
import {
  MARKETPLACE_NAMES,
  SIGN_FREE_MESSAGE,
  getCurrentMarketplace,
  getMarketProgress,
  isOnchainCancelStarted,
  joinNames,
  marketplaceLabel,
  type CancelRun,
  type MarketplaceProgress,
  type SeaportRun,
} from './seaport-progress'
import type { BusyScreen } from './seaport-views'

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many)

// ---------------------------------------------------------------------------------------------
// List Name / Edit Listings
// ---------------------------------------------------------------------------------------------

export interface ListingRunInput {
  status: ListingStatus
  run: SeaportRun
  /** The old-listing cancel that follows when editing with "Cancel old listings" on. */
  cancel: CancelRun
  /** The picked marketplaces in the order the client runs them (OpenSea first). */
  marketplaces: MarketplaceType[]
  /** Beautified names being listed. */
  names: string[]
  /** How many old listings are cancelled after; 0 when the toggle is off or nothing is being edited. */
  oldListingCount: number
  /** How many of the old listings are on OpenSea, which need an onchain cancel. */
  oldOpenSeaCount: number
  /** Fallback for a run that reported nothing yet. */
  approveTxHash: string | null
}

const getApprovalStep = (marketplace: MarketplaceType, progress: MarketplaceProgress, label: string): TxStep => {
  const { phase, approvals, approvalIndex, approvalHashes } = progress
  const status: TxStep['status'] =
    phase === 'approving' ? 'active' : phase === 'signing' || phase === 'done' || approvals === 0 ? 'done' : 'upcoming'
  const hashes = approvalHashes.filter(Boolean)
  const hasMany = (approvals ?? 0) > 1

  return {
    key: `approve-${marketplace}`,
    label,
    status,
    // Counts this marketplace's approvals (registry, NameWrapper, BaseRegistrar) while they run
    batch: hasMany && status === 'active' ? `${Math.min(approvalIndex + 1, approvals!)} / ${approvals}` : undefined,
    hash: hasMany ? undefined : (hashes[0] ?? null),
    links: hasMany ? hashes.map((hash, index) => ({ key: `${marketplace}-${index}`, hash })) : undefined,
  }
}

const getSignStep = (marketplace: MarketplaceType, progress: MarketplaceProgress, label: string): TxStep => ({
  key: `sign-${marketplace}`,
  label,
  status: progress.phase === 'done' ? 'done' : progress.phase === 'signing' ? 'active' : 'upcoming',
})

export const getListingSteps = ({
  status,
  run,
  cancel,
  marketplaces,
  names,
  oldListingCount,
}: ListingRunInput): TxStep[] => {
  const isMulti = marketplaces.length > 1
  const listingWord = plural(names.length, 'Listing', 'Listings')
  const steps: TxStep[] = []

  marketplaces.forEach((marketplace) => {
    const progress = getMarketProgress(run, marketplace)
    const name = MARKETPLACE_NAMES[marketplace]

    steps.push(
      getApprovalStep(marketplace, progress, isMulti ? `Approve Transfers on ${name}` : 'Approve NFT Transfer'),
      getSignStep(marketplace, progress, isMulti ? `Sign ${listingWord} on ${name}` : `Sign ${listingWord}`)
    )
  })

  steps.push({
    key: 'publish',
    label: `Publish ${isMulti ? 'Listings' : listingWord}`,
    status:
      run.publish === 'active' ? 'active' : run.publish === 'done' || status === 'cancelling' ? 'done' : 'upcoming',
  })

  if (oldListingCount > 0) {
    steps.push({
      key: 'cancel-old',
      label: plural(oldListingCount, 'Cancel Old Listing', 'Cancel Old Listings'),
      status: status === 'cancelling' ? 'active' : 'upcoming',
      hash: cancel.hash,
    })
  }

  return steps
}

const getListingStatus = ({
  status,
  run,
  cancel,
  marketplaces,
  names,
  oldListingCount,
  oldOpenSeaCount,
  approveTxHash,
}: ListingRunInput): BusyScreen['status'] => {
  const isMulti = marketplaces.length > 1
  const isMany = names.length > 1
  const listingWord = isMany ? 'Listings' : 'Listing'
  const selectedLabel = marketplaceLabel(marketplaces)

  if (status === 'cancelling') {
    const oldWord = plural(oldListingCount, 'Cancel Old Listing', 'Cancel Old Listings')
    const cancellingTitle = plural(oldListingCount, 'Cancelling Old Listing', 'Cancelling Old Listings')

    if (cancel.phase === 'prompt') {
      return {
        state: 'wallet',
        title: oldWord,
        message: `Your old OpenSea ${plural(oldOpenSeaCount, 'listing is', 'listings are')} cancelled onchain. Please confirm the transaction in your wallet.`,
      }
    }

    if (cancel.phase === 'sent' || cancel.phase === 'update') {
      return { state: 'pending', title: cancellingTitle, message: 'Waiting for onchain confirmation' }
    }

    return {
      state: 'pending',
      title: cancellingTitle,
      message:
        oldListingCount > oldOpenSeaCount
          ? `Removing your old ${plural(oldListingCount - oldOpenSeaCount, 'listing', 'listings')} from Grails`
          : 'Preparing the onchain cancellation',
    }
  }

  if (run.publish === 'active') {
    return {
      state: 'pending',
      title: `Publishing ${isMulti ? 'Listings' : listingWord}`,
      message: isMany
        ? `Saving ${names.length} listings on ${selectedLabel}`
        : `Saving your ${isMulti ? 'listings' : 'listing'} on ${selectedLabel}`,
    }
  }

  const current = getCurrentMarketplace(run, marketplaces)
  const phase = current ? getMarketProgress(run, current).phase : null
  const approving = (sent: boolean, marketplace: MarketplaceType | null): BusyScreen['status'] =>
    sent
      ? {
          state: 'pending',
          title: 'Approving NFT Transfer',
          message: `${isMulti && marketplace ? `${MARKETPLACE_NAMES[marketplace]} · ` : ''}Approving Seaport to transfer your ${isMany ? 'names' : 'name'}`,
        }
      : { state: 'wallet', title: 'Approve NFT Transfer', message: 'Please confirm the approval in your wallet' }

  if (current && phase === 'approving') return approving(getMarketProgress(run, current).approvalSent, current)

  if (current && phase === 'signing') {
    return {
      state: 'wallet',
      title: isMulti ? `Sign ${MARKETPLACE_NAMES[current]} ${listingWord}` : `Sign ${listingWord}`,
      message: SIGN_FREE_MESSAGE,
    }
  }

  // Nothing reported yet: fall back on the status the client sets
  if (!current && status === 'approving') return approving(!!approveTxHash, null)
  if (!current && status === 'submitting') {
    return { state: 'wallet', title: `Sign ${listingWord}`, message: SIGN_FREE_MESSAGE }
  }

  // Checking: the first check names every picked marketplace, a later one only its own
  const isFirstCheck = !marketplaces.some((marketplace) => getMarketProgress(run, marketplace).phase === 'done')
  return {
    state: 'checking',
    title: 'Checking Approval',
    message: `Checking if you have approved the NFT collection for ${
      current && !isFirstCheck ? MARKETPLACE_NAMES[current] : selectedLabel
    }`,
  }
}

export const getListingBusyScreen = (input: ListingRunInput): BusyScreen => {
  const status = getListingStatus(input)

  return {
    status,
    steps: getListingSteps(input),
    chips: input.run.publish === 'active' && input.names.length > 1 ? input.names : undefined,
  }
}

export const getListingSuccess = ({
  names,
  marketplaces,
  isEditing,
}: {
  names: string[]
  marketplaces: MarketplaceType[]
  isEditing: boolean
}): { title: string; message: string; chips?: NameChip[] } => {
  const label = marketplaceLabel(marketplaces)
  const isMulti = marketplaces.length > 1
  const isMany = names.length > 1
  const chips = isMany ? names.map((name) => ({ name, done: true })) : undefined

  if (isEditing) {
    return {
      title: isMany || isMulti ? 'Listings Updated' : 'Listing Updated',
      message: isMany
        ? `The new listings for ${names.length} names are active on ${label}.`
        : `The new ${isMulti ? 'listings' : 'listing'} for ${names[0]} ${isMulti ? 'are' : 'is'} active on ${label}.`,
      chips,
    }
  }

  return {
    title: 'Listing Successful',
    message: isMany ? `${names.length} names are now listed on ${label}.` : `${names[0]} is now listed on ${label}.`,
    chips,
  }
}

/** Only the old-listing cancel failed: the new listings are live. */
export const getOldListingsNotCancelled = ({
  names,
  marketplaces,
  cancel,
  oldListingCount,
  oldOpenSeaCount,
}: {
  names: string[]
  marketplaces: MarketplaceType[]
  cancel: CancelRun
  oldListingCount: number
  oldOpenSeaCount: number
}) => {
  const newCount = names.length * marketplaces.length
  const label = marketplaceLabel(marketplaces)
  // Once the onchain cancel started, the old Grails listings were already removed
  const onlyOpenSeaLeft = oldListingCount > oldOpenSeaCount && isOnchainCancelStarted(cancel)

  return {
    title: plural(oldListingCount, 'Old Listing Not Cancelled', 'Old Listings Not Cancelled'),
    message: `Your new ${plural(newCount, 'listing is', 'listings are')} live. Only cancelling the old ${plural(oldListingCount, 'one', 'ones')} failed.`,
    warning: {
      title:
        newCount === 1 ? `Your new listing is active on ${label}.` : `${newCount} new listings are active on ${label}.`,
      body: onlyOpenSeaLeft
        ? `The old OpenSea ${plural(oldOpenSeaCount, 'listing is', 'listings are')} still active too.`
        : `Your old ${plural(oldListingCount, 'listing is', 'listings are')} still active too.`,
    },
  }
}

// ---------------------------------------------------------------------------------------------
// Cancel Listings
// ---------------------------------------------------------------------------------------------

export interface CancelListingsInput {
  cancel: CancelRun
  total: number
  grailsCount: number
  openSeaCount: number
}

export const getCancelListingsBusyScreen = ({
  cancel,
  total,
  grailsCount,
  openSeaCount,
}: CancelListingsInput): BusyScreen => {
  const onchain = isOnchainCancelStarted(cancel)
  const steps: TxStep[] = []

  if (grailsCount > 0) {
    steps.push({ key: 'grails', label: 'Cancel on Grails', status: onchain ? 'done' : 'active' })
  }

  if (openSeaCount > 0) {
    steps.push({
      key: 'opensea',
      label: 'Cancel on OpenSea',
      // With no Grails listings, the API call that prepares the cancel is part of this step
      status: onchain || grailsCount === 0 ? 'active' : 'upcoming',
      hash: cancel.hash,
    })
  }

  const cancellingTitle = plural(total, 'Cancelling Listing', 'Cancelling Listings')

  if (cancel.phase === 'prompt') {
    return {
      status: {
        state: 'wallet',
        title: 'Confirm Cancellation',
        message: 'Cancelling on OpenSea is an onchain transaction. Please confirm it in your wallet.',
      },
      steps,
    }
  }

  if (onchain) {
    return {
      status: { state: 'pending', title: 'Cancelling on OpenSea', message: 'Waiting for onchain confirmation' },
      steps,
    }
  }

  if (grailsCount === 0) {
    return {
      status: { state: 'checking', title: cancellingTitle, message: 'Preparing the onchain cancellation' },
      steps,
    }
  }

  return {
    status: {
      state: 'pending',
      title: cancellingTitle,
      message: `Removing ${grailsCount} ${plural(grailsCount, 'listing', 'listings')} from Grails`,
    },
    steps,
  }
}

export const getCancelListingsSuccess = ({
  names,
  total,
  sources,
}: {
  names: string[]
  total: number
  sources: MarketplaceType[]
}) => {
  const uniqueNames = Array.from(new Set(names))
  const subject = uniqueNames.length <= 3 ? joinNames(uniqueNames) : `${uniqueNames.length} names`

  return {
    title: plural(total, 'Listing Cancelled', 'Listings Cancelled'),
    message: `${subject} ${uniqueNames.length === 1 ? 'is' : 'are'} no longer listed on ${marketplaceLabel(sources, 'or')}.`,
  }
}

/** The Grails listings were cancelled, the OpenSea cancel failed. */
export const getCancelListingsPartial = ({
  cancel,
  grailsCount,
  openSeaNames,
}: {
  cancel: CancelRun
  grailsCount: number
  openSeaNames: string[]
}) => {
  if (grailsCount === 0 || openSeaNames.length === 0 || !isOnchainCancelStarted(cancel)) return null
  const isOne = openSeaNames.length === 1

  return {
    title: `${grailsCount} Grails ${plural(grailsCount, 'listing was', 'listings were')} cancelled.`,
    body: `The OpenSea ${isOne ? 'listing' : 'listings'} for ${joinNames(openSeaNames)} ${isOne ? 'is' : 'are'} still active. Trying again only cancels ${isOne ? 'that one' : 'those'}.`,
  }
}
