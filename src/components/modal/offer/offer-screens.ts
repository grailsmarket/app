import type { TxStep } from '@/components/ui/modal/txSteps'
import type { MarketplaceType } from '@/lib/seaport/seaportClient'
import {
  MARKETPLACE_NAMES,
  SIGN_FREE_MESSAGE,
  getCurrentMarketplace,
  getMarketProgress,
  marketplaceLabel,
  type CancelRun,
  type SeaportRun,
} from '../listing/seaport-progress'
import type { BusyScreen } from '../listing/seaport-views'

// ---------------------------------------------------------------------------------------------
// Make Offer
// ---------------------------------------------------------------------------------------------

export interface MakeOfferRunInput {
  run: SeaportRun
  /** The picked marketplaces in the order the client runs them (OpenSea first). */
  marketplaces: MarketplaceType[]
  currency: 'WETH' | 'USDC'
  /** "1,000 USDC" */
  amountLabel: string
}

export const getMakeOfferSteps = ({ run, marketplaces, currency }: MakeOfferRunInput): TxStep[] => {
  const isMulti = marketplaces.length > 1
  const steps: TxStep[] = []

  marketplaces.forEach((marketplace) => {
    const progress = getMarketProgress(run, marketplace)
    const name = MARKETPLACE_NAMES[marketplace]
    const signed = progress.phase === 'done'

    // The approval only happens when the allowance is below the price, so it shows once the client has checked
    if ((progress.approvals ?? 0) > 0) {
      steps.push({
        key: `approve-${marketplace}`,
        label: isMulti ? `Approve ${currency} for ${name}` : `Approve ${currency}`,
        status:
          progress.phase === 'approving' ? 'active' : progress.phase === 'signing' || signed ? 'done' : 'upcoming',
        hash: progress.approvalHashes[0] ?? null,
      })
    }

    steps.push({
      key: `sign-${marketplace}`,
      label: isMulti ? `Sign ${name} Offer` : 'Sign Offer',
      status: signed ? 'done' : progress.phase === 'signing' ? 'active' : 'upcoming',
    })
  })

  steps.push({
    key: 'publish',
    label: isMulti ? 'Publish Offers' : 'Publish Offer',
    status: run.publish === 'active' ? 'active' : run.publish === 'done' ? 'done' : 'upcoming',
  })

  return steps
}

export const getMakeOfferBusyScreen = (input: MakeOfferRunInput): BusyScreen => {
  const { run, marketplaces, currency, amountLabel } = input
  const isMulti = marketplaces.length > 1
  const label = marketplaceLabel(marketplaces)
  const steps = getMakeOfferSteps(input)

  if (run.publish === 'active') {
    return {
      status: {
        state: 'pending',
        title: isMulti ? 'Publishing Offers' : 'Publishing Offer',
        message: `Saving your ${isMulti ? 'offers' : 'offer'} on ${label}`,
      },
      steps,
    }
  }

  const current = getCurrentMarketplace(run, marketplaces)
  const progress = current ? getMarketProgress(run, current) : null

  if (current && progress?.phase === 'approving') {
    return {
      status: progress.approvalSent
        ? {
            state: 'pending',
            title: `Approving ${currency}`,
            message: `Approving ${amountLabel} for ${MARKETPLACE_NAMES[current]}`,
          }
        : { state: 'wallet', title: `Approve ${currency}`, message: 'Please confirm the approval in your wallet' },
      steps,
    }
  }

  if (current && progress?.phase === 'signing') {
    return {
      status: {
        state: 'wallet',
        title: isMulti ? `Sign ${MARKETPLACE_NAMES[current]} Offer` : 'Sign Offer',
        message: SIGN_FREE_MESSAGE,
      },
      steps,
    }
  }

  // Before the first prompt the client reads the balance and the allowance
  const isFirstCheck = !marketplaces.some((marketplace) => getMarketProgress(run, marketplace).phase === 'done')
  return {
    status: {
      state: 'checking',
      title: 'Checking Allowance',
      message: `Checking your ${currency} allowance for ${current && !isFirstCheck ? MARKETPLACE_NAMES[current] : label}`,
    },
    steps,
  }
}

/** One marketplace published and the other did not. */
export const getMakeOfferPartial = (run: SeaportRun, marketplaces: MarketplaceType[]) => {
  const live = marketplaces.filter((marketplace) => run.published[marketplace] === true)
  const failed = marketplaces.filter((marketplace) => run.published[marketplace] === false)
  if (live.length === 0 || failed.length === 0) return null

  return {
    title: 'Offer Partly Created',
    message: 'Your offer is live on one marketplace.',
    warning: {
      title: `Your ${marketplaceLabel(live)} offer is live.`,
      body: `The ${marketplaceLabel(failed)} offer could not be published.`,
    },
  }
}

// ---------------------------------------------------------------------------------------------
// Accept Offer
// ---------------------------------------------------------------------------------------------

export type AcceptOfferStep = 'review' | 'approving' | 'confirming' | 'processing' | 'success' | 'error'

export interface AcceptOfferInput {
  step: AcceptOfferStep
  needsApproval: boolean
  approveTxHash: string | null
  txHash: string | null
}

export const getAcceptOfferBusyScreen = ({
  step,
  needsApproval,
  approveTxHash,
  txHash,
}: AcceptOfferInput): BusyScreen => {
  const isApproving = step === 'approving'
  const isSubmitted = step === 'processing' && !!txHash
  const steps: TxStep[] = []

  if (needsApproval || approveTxHash) {
    steps.push({
      key: 'approve',
      label: 'Approve NFT Transfer',
      status: isApproving ? 'active' : 'done',
      hash: approveTxHash,
    })
  }

  steps.push(
    { key: 'accept', label: 'Accept Offer', status: isApproving ? 'upcoming' : isSubmitted ? 'done' : 'active' },
    {
      key: 'onchain',
      label: 'Onchain Confirmation',
      status: isSubmitted ? 'active' : 'upcoming',
      hash: isSubmitted ? txHash : null,
    }
  )

  if (isApproving) {
    return {
      status: approveTxHash
        ? { state: 'pending', title: 'Approving NFT Transfer', message: 'Approving Seaport to transfer your name' }
        : { state: 'wallet', title: 'Approve NFT Transfer', message: 'Please confirm the approval in your wallet' },
      steps,
    }
  }

  // `confirming` only validates the offer and simulates the sale; no wallet prompt is open yet
  if (step === 'confirming') {
    return {
      status: { state: 'checking', title: 'Checking Offer', message: 'Validating the offer and simulating the sale' },
      steps,
    }
  }

  if (isSubmitted) {
    return {
      status: {
        state: 'pending',
        title: 'Processing Transaction',
        message: 'Transaction submitted. Waiting for onchain confirmation.',
      },
      steps,
    }
  }

  return {
    status: { state: 'wallet', title: 'Accept Offer', message: 'Please confirm the sale in your wallet' },
    steps,
  }
}

// ---------------------------------------------------------------------------------------------
// Cancel Offer
// ---------------------------------------------------------------------------------------------

export const getCancelOfferBusyScreen = ({
  cancel,
  isOpenSea,
}: {
  cancel: CancelRun
  isOpenSea: boolean
}): BusyScreen => {
  const isRemoving = cancel.phase === 'update' || !isOpenSea
  const steps: TxStep[] = []

  if (isOpenSea) {
    steps.push({
      key: 'opensea',
      label: 'Cancel on OpenSea',
      status: isRemoving ? 'done' : 'active',
      hash: cancel.hash,
    })
  }

  steps.push({ key: 'remove', label: 'Remove Offer', status: isRemoving ? 'active' : 'upcoming' })

  if (isRemoving) {
    return {
      status: { state: 'pending', title: 'Removing Offer', message: 'Removing your offer from Grails' },
      steps,
    }
  }

  if (cancel.phase === 'sent') {
    return {
      status: { state: 'pending', title: 'Cancelling Offer', message: 'Waiting for onchain confirmation' },
      steps,
    }
  }

  return {
    status: {
      state: 'wallet',
      title: 'Confirm Cancellation',
      message: 'Cancelling an OpenSea offer is an onchain transaction. Please confirm it in your wallet.',
    },
    steps,
  }
}
