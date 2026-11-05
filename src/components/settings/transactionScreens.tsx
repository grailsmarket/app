'use client'

import React from 'react'
import TxStatus from '@/components/ui/modal/txStatus'
import TxSteps, { type TxStep } from '@/components/ui/modal/txSteps'
import TxLink from '@/components/ui/modal/txLink'
import Notice from '@/components/ui/modal/notice'
import type { TxState } from '@/components/ui/modal/statusOrb'
import type { SettingsTransactionStepState } from '@/hooks/settings/useSettingsTransaction'

// The busy, success and error screens of a settings transaction queue. The Settings page shows them in
// SettingsTransactionModal; the migration modal shows them in its own shell. Everything here is pure, so the
// screens render from mock state as well as from useSettingsTransaction.

export const KEEP_OPEN_HINT = 'Keep this window open until the transaction confirms.'
export const SAVED_FOR_RETRY = 'Confirmed transactions are saved. Your remaining changes are kept for retry.'
export const ALREADY_SUBMITTED = 'This transaction has already been submitted. Check its status before continuing.'

export interface SettingsTransactionView {
  phase: 'preparing' | 'confirming' | 'processing' | 'success' | 'error'
  /** The preparing status line, e.g. "Checking onchain data…". */
  status?: string
  /** The current step's label. */
  label?: string
  error?: string | null
  /** The raw error text, folded into the danger Notice. */
  details?: string | null
  /** The current transaction: confirming while processing, unconfirmed when `submitted`. */
  hash?: string | null
  /** Used when the queue reports no hashes of its own, e.g. resolver permissions. */
  explorerUrl?: string | null
  progress?: { current: number; total: number }
  steps?: SettingsTransactionStepState[]
  /** The step running now, or `steps.length` once all are done. */
  index?: number
  /** A transaction went out and its receipt never came. */
  submitted: boolean
}

export interface SettingsTransactionLink {
  key: string
  hash: string
}

export const isTransactionBusy = (view: SettingsTransactionView) =>
  view.phase === 'preparing' || view.phase === 'confirming' || view.phase === 'processing'

const isNetworkSwitch = (view: SettingsTransactionView) =>
  view.phase === 'preparing' && !!view.status?.startsWith('Switch to ')

/** The wallet has a prompt open, so the TxStatus already says what to do and the keep-open hint stays hidden. */
export const isWalletPrompt = (view: SettingsTransactionView) => view.phase === 'confirming' || isNetworkSwitch(view)

const TX_URL_HASH = /\/tx\/(0x[0-9a-fA-F]{64})$/

/** The transaction in flight. A caller that only reports an explorer URL (resolver permissions) still gets its hash. */
const currentHash = (view: SettingsTransactionView) =>
  view.hash ?? view.explorerUrl?.match(TX_URL_HASH)?.[1] ?? undefined

const currentIndex = (view: SettingsTransactionView) =>
  view.index ?? (view.progress ? Math.max(0, view.progress.current - 1) : 0)

/** The label of the step running now, or of the step that failed. */
export const currentStepLabel = (view: SettingsTransactionView, fallback: string) =>
  view.label ?? view.steps?.[currentIndex(view)]?.label ?? fallback

/** "atlas.eth, ember.eth and quartz.eth"; longer lists end in "and 3 more". */
export const listNames = (names: string[], shown = 3) => {
  if (names.length <= 1) return names[0] ?? ''
  if (names.length > shown) return `${names.slice(0, shown).join(', ')} and ${names.length - shown} more`
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

export const transactionStatus = (
  view: SettingsTransactionView,
  title: string,
  networkName?: string
): { state: TxState; title: string; message: string } => {
  const step = view.steps?.[currentIndex(view)]
  const label = currentStepLabel(view, title)
  const total = view.progress?.total ?? view.steps?.length ?? 1
  const position = view.progress?.current ?? currentIndex(view) + 1

  if (view.phase === 'preparing') {
    if (isNetworkSwitch(view)) return { state: 'wallet', title: 'Switch Network', message: view.status! }
    return { state: 'checking', title: label, message: view.status || 'Preparing transaction…' }
  }

  if (view.phase === 'confirming') {
    const message =
      total > 1 || step?.note
        ? [total > 1 && `Transaction ${position} of ${total}.`, step?.note, 'Please confirm it in your wallet.']
            .filter(Boolean)
            .join(' ')
        : 'Please confirm the transaction in your wallet'

    return { state: 'wallet', title: label, message }
  }

  return {
    state: 'pending',
    title: step?.pendingLabel ?? label,
    message: networkName ? `${networkName} · Waiting for confirmation` : 'Waiting for confirmation',
  }
}

// One transaction reads as its prompt and its onchain wait, as in every other modal.
const singleTransactionSteps = (label: string, sent: boolean, hash?: string): TxStep[] => [
  { key: 'confirm', label, status: sent ? 'done' : 'active' },
  {
    key: 'onchain',
    label: 'Onchain Confirmation',
    status: sent ? 'active' : 'upcoming',
    hash: sent ? hash : undefined,
  },
]

/** The step rows while the queue runs. A step skipped because it had nothing to send shows done, with no hash. */
export const transactionSteps = (view: SettingsTransactionView, title: string): TxStep[] => {
  const sent = view.phase === 'processing'
  const hash = currentHash(view)

  // Without a step list (resolver permissions): one row for the action, counting its batches.
  if (!view.steps?.length) {
    const label = view.label ?? title
    const total = view.progress?.total ?? 0

    if (total <= 1) return singleTransactionSteps(label, sent, hash)

    return [
      {
        key: 'batches',
        label,
        status: 'active',
        batch: `${view.progress!.current} / ${total}`,
        hash: sent ? hash : undefined,
      },
    ]
  }

  if (view.steps.length === 1) return singleTransactionSteps(view.steps[0].label, sent, view.steps[0].hash ?? hash)

  const at = currentIndex(view)

  return view.steps.map((step, index) => ({
    key: `${index}:${step.label}`,
    label: step.label,
    status: index < at ? 'done' : index === at ? 'active' : 'upcoming',
    hash: index < at || (index === at && sent) ? step.hash : undefined,
  }))
}

/** Every confirmed transaction, in order. */
export const confirmedTransactions = (view: SettingsTransactionView): SettingsTransactionLink[] => {
  if (!view.steps?.length) {
    const hash = currentHash(view)
    return view.phase === 'success' && hash ? [{ key: 'last', hash }] : []
  }

  const reached = view.phase === 'success' ? view.steps.length : currentIndex(view)

  return view.steps
    .slice(0, reached)
    .flatMap((step, index) => (step.hash ? [{ key: `${index}:${step.label}`, hash: step.hash }] : []))
}

/** The transactions the queue sends, leaving out steps that turned out to need none. */
export const sentTransactionCount = (view: SettingsTransactionView) =>
  view.steps?.length ? view.steps.filter((step) => !step.skipped).length : (view.progress?.total ?? 1)

interface TransactionLinksProps {
  links: SettingsTransactionLink[]
  /** The label when there is only one link. Several are numbered "Transaction 1…n". */
  single?: string
  /** Inside a Notice, whose body is a paragraph. */
  inline?: boolean
}

export const TransactionLinks: React.FC<TransactionLinksProps> = ({ links, single = 'View on Etherscan', inline }) => {
  if (!links.length) return null

  const Wrapper = inline ? 'span' : 'div'

  return (
    <Wrapper className={inline ? 'mt-2 flex flex-wrap gap-1.5' : 'flex flex-wrap justify-center gap-1.5'}>
      {links.map((link, index) => (
        <TxLink
          key={link.key}
          hash={link.hash}
          label={links.length > 1 || !single ? `Transaction ${index + 1}` : single}
        />
      ))}
    </Wrapper>
  )
}

interface TransactionProgressProps {
  view: SettingsTransactionView
  /** The action's title, used when the queue has not named its step yet. */
  title: string
  /** Prefixes the onchain wait: "Sepolia · Waiting for confirmation". */
  networkName?: string
}

export const TransactionProgress: React.FC<TransactionProgressProps> = ({ view, title, networkName }) => (
  <>
    <TxStatus {...transactionStatus(view, title, networkName)} />
    <TxSteps steps={transactionSteps(view, title)} />
  </>
)

interface TransactionFailureProps {
  view: SettingsTransactionView
  title: string
  message: React.ReactNode
}

/** An error before the queue finished: what failed, what already went through, then the error itself. */
export const TransactionFailure: React.FC<TransactionFailureProps> = ({ view, title, message }) => {
  const confirmed = confirmedTransactions(view)

  return (
    <>
      <TxStatus state='error' title={title} message={message} />
      {confirmed.length > 0 && (
        <Notice tone='warning' title={`${confirmed.length} of ${sentTransactionCount(view)} transactions confirmed.`}>
          {SAVED_FOR_RETRY}
          <TransactionLinks links={confirmed} single='' inline />
        </Notice>
      )}
      <Notice tone='danger' details={view.details}>
        {view.error || 'The transaction could not be completed.'}
      </Notice>
    </>
  )
}

/** A transaction went out but its receipt never came: only checking it again is safe. */
export const TransactionUnconfirmed: React.FC<{ view: SettingsTransactionView }> = ({ view }) => (
  <>
    <TxStatus state='error' title='Check Your Transaction' message={ALREADY_SUBMITTED}>
      <TxLink label='View transaction' hash={currentHash(view)} />
    </TxStatus>
    {view.error && (
      <Notice tone='danger' details={view.details}>
        {view.error}
      </Notice>
    )}
  </>
)
