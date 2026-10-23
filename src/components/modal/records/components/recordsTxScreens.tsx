'use client'

import React from 'react'
import Image from 'next/image'
import AssetSummary from '@/components/ui/modal/assetSummary'
import TxStatus from '@/components/ui/modal/txStatus'
import TxSteps, { type TxStep } from '@/components/ui/modal/txSteps'
import TxLink from '@/components/ui/modal/txLink'
import Notice from '@/components/ui/modal/notice'
import NameChips from '@/components/ui/modal/nameChips'
import type { TxState } from '@/components/ui/modal/statusOrb'
import { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import NameImage from '@/components/ui/nameImage'
import { REGISTERED } from '@/constants/domains/registrationStatuses'
import { activeChain } from '@/constants/web3/chain'
import { config } from '@/lib/config'
import { beautifyName } from '@/lib/ens'
import type { EditStep, V1TxKind } from '@/hooks/records/useEditRecords'
import type { V2EditPhase } from '@/hooks/records/useV2EditRecords'
import type { RoleTransactionPhase } from '@/hooks/records/useV2Roles'
import type { BulkEditStep, TransactionStatus } from '@/hooks/records/useBulkEditRecords'
import {
  KEEP_OPEN_HINT,
  GhostButton,
  TxLinkList,
  VersionBadge,
  formatList,
  plural,
  shortAddress,
  txLinkLabel,
  type TxScreen,
} from './txScreen'

// The in-progress, success and error screens of the records flows (flows.md, "Edit Records").
// Each builder is a pure function of the hook state it is given, so the preview route can render it from mocks.
// A builder returns null while its flow is on the editor form.

type Status = { state: TxState; title: string; message?: string }

const NameTile: React.FC<{ name: string; version: number }> = ({ name, version }) => (
  <NameImage
    name={name}
    tokenId=''
    version={version}
    expiryDate={null}
    forceRegStatus={REGISTERED}
    className='h-full w-full'
    height={48}
    width={48}
  />
)

const closeButton = (onClose: () => void, label = 'Close') => (
  <SecondaryButton onClick={onClose} className={modalActionClassName}>
    {label}
  </SecondaryButton>
)

const retryFooter = (label: string, onRetry: () => void, onClose: () => void, closeLabel = 'Close') => (
  <>
    <PrimaryButton onClick={onRetry} className={modalPrimaryActionClassName}>
      {label}
    </PrimaryButton>
    {closeButton(onClose, closeLabel)}
  </>
)

const ErrorNotice: React.FC<{ error: string | null; details?: string | null }> = ({ error, details }) => (
  <Notice tone='danger' details={details}>
    {error || 'An unknown error occurred'}
  </Notice>
)

/** Links inside a Notice, after its sentence. */
const NoticeLinks: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className='mt-2 flex flex-wrap gap-1.5'>{children}</span>
)

const UNCONFIRMED_MESSAGE = 'Your transaction was submitted. Check its confirmation before sending another transaction.'

// ---------------------------------------------------------------------------------------------------------------
// V1 (useEditRecords): Save Records · Change Manager · Transfer Ownership, only the ones with changes.

const V1_STEP_LABELS: Record<V1TxKind, string> = {
  records: 'Save Records',
  manager: 'Change Manager',
  owner: 'Transfer Ownership',
}
const V1_PENDING_TITLES: Record<V1TxKind, string> = {
  records: 'Saving Records',
  manager: 'Changing Manager',
  owner: 'Transferring Ownership',
}
const V1_NOUNS: Record<V1TxKind, string> = { records: 'records', manager: 'manager', owner: 'owner' }
const V1_SAVED_NOUNS: Record<V1TxKind, string> = { records: 'records', manager: 'new manager', owner: 'new owner' }
// "records" takes "are"; a lone manager or owner takes "is".
const v1Verb = (kinds: V1TxKind[]) => (kinds.length === 1 && kinds[0] !== 'records' ? 'is' : 'are')

export interface V1ScreenInput {
  name: string
  step: EditStep
  plan: V1TxKind[]
  current: V1TxKind | null
  hashes: Partial<Record<V1TxKind, string>>
  confirmed: V1TxKind[]
  recordCount: number
  error: string | null
  errorDetails: string | null
  /** Back to the form with the values kept. */
  onTryAgain: () => void
  onClose: () => void
}

export const getV1Steps = ({ plan, current, hashes }: Pick<V1ScreenInput, 'plan' | 'current' | 'hashes'>): TxStep[] => {
  const at = current ? plan.indexOf(current) : -1

  return plan.map((kind, index) => ({
    key: kind,
    label: V1_STEP_LABELS[kind],
    status: index < at ? 'done' : index === at ? 'active' : 'upcoming',
    hash: hashes[kind] ?? null,
  }))
}

export const getV1Screen = (input: V1ScreenInput): TxScreen | null => {
  const { name, step, plan, current, hashes, confirmed, recordCount, error, errorDetails, onTryAgain, onClose } = input
  const display = beautifyName(name)
  const meta = [
    plan.includes('records') && plural(recordCount, 'record'),
    plan.includes('manager') && 'new manager',
    plan.includes('owner') && 'new owner',
  ]
    .filter(Boolean)
    .join(' · ')
  const subject = (compact: boolean) => (
    <AssetSummary
      name={display}
      compact={compact}
      badge={<VersionBadge version={1} />}
      meta={meta || undefined}
      image={<NameTile name={name} version={1} />}
    />
  )

  if (step === 'confirming' || step === 'processing') {
    const kind = current ?? plan[0] ?? 'records'
    const index = plan.indexOf(kind)
    const status: Status =
      step === 'confirming'
        ? {
            state: 'wallet',
            title: V1_STEP_LABELS[kind],
            message:
              plan.length > 1
                ? `Transaction ${index + 1} of ${plan.length}. Please confirm it in your wallet.`
                : 'Please confirm the transaction in your wallet.',
          }
        : { state: 'pending', title: V1_PENDING_TITLES[kind], message: 'Waiting for onchain confirmation' }

    return {
      key: 'progress',
      locked: true,
      subject: subject(true),
      body: (
        <>
          <TxStatus {...status} />
          {plan.length > 0 && <TxSteps steps={getV1Steps({ plan, current, hashes })} />}
        </>
      ),
      footerHint: step === 'processing' ? KEEP_OPEN_HINT : undefined,
    }
  }

  if (step === 'success') {
    const message =
      plan.length > 0
        ? `The ${formatList(plan.map((kind) => V1_NOUNS[kind]))} of ${display} ${v1Verb(plan)} updated.`
        : `Your changes to ${display} are saved.`
    const links = plan.flatMap((kind) => (hashes[kind] ? [{ key: kind, hash: hashes[kind] }] : []))

    return {
      key: 'success',
      locked: false,
      subject: subject(false),
      body: (
        <TxStatus state='success' title='Changes Saved' message={message}>
          <TxLinkList links={links} />
        </TxStatus>
      ),
      footer: closeButton(onClose),
    }
  }

  if (step === 'error') {
    const unsaved = plan.filter((kind) => !confirmed.includes(kind))
    const isPartial = confirmed.length > 0 && unsaved.length > 0

    return {
      key: 'error',
      locked: false,
      subject: subject(true),
      body: (
        <>
          <TxStatus state='error' title='Transaction Failed' message='Review the details below and try again.' />
          {isPartial && (
            <Notice tone='warning' title={`${confirmed.length} of ${plan.length} transactions confirmed.`}>
              Your {formatList(confirmed.map((kind) => V1_SAVED_NOUNS[kind]))} {v1Verb(confirmed)} saved. The{' '}
              {formatList(unsaved.map((kind) => V1_NOUNS[kind]))} did not change.
              <NoticeLinks>
                {confirmed.map((kind) => (
                  <TxLink key={kind} hash={hashes[kind]} label={`Transaction ${plan.indexOf(kind) + 1}`} />
                ))}
              </NoticeLinks>
            </Notice>
          )}
          <ErrorNotice error={error} details={errorDetails} />
        </>
      ),
      footer: retryFooter('Try Again', onTryAgain, onClose),
    }
  }

  return null
}

// ---------------------------------------------------------------------------------------------------------------
// V2 records (useV2EditRecords): one transaction per action, Save Records · Onchain Confirmation.

export type V2Operation = 'records' | 'resolver' | 'deploy'

const V2_ACTIONS: Record<V2Operation, { step: string; pending: string }> = {
  records: { step: 'Save Records', pending: 'Saving Changes' },
  resolver: { step: 'Change Resolver', pending: 'Changing Resolver' },
  deploy: { step: 'Deploy Resolver', pending: 'Deploying Resolver' },
}

export interface V2EditorScreenInput {
  name: string
  step: EditStep
  phase: V2EditPhase
  operation: V2Operation
  txHash: string | null
  /** A transaction went out and its receipt never came. */
  pending: boolean
  error: string | null
  errorDetails: string | null
  meta?: string
  successMessage?: string
  /** Role or resolver drafts remain: success offers "Back to Editor". */
  draftsRemain: boolean
  onBack: () => void
  onCheck: () => void
  onReload: () => void
  onClose: () => void
}

const v2Subject = (name: string, meta: string | undefined, compact: boolean) => (
  <AssetSummary
    name={beautifyName(name)}
    compact={compact}
    badge={<VersionBadge version={2} />}
    meta={meta}
    image={<NameTile name={name} version={2} />}
  />
)

export const getV2EditorScreen = (input: V2EditorScreenInput): TxScreen | null => {
  const { name, step, phase, operation, txHash, pending, error, errorDetails, meta } = input
  const action = V2_ACTIONS[operation]

  if (step === 'confirming' || step === 'processing') {
    const isProcessing = step === 'processing'
    const isWallet = !isProcessing && phase === 'wallet'
    const status: Status = isProcessing
      ? { state: 'pending', title: action.pending, message: `${activeChain.name} · Waiting for confirmation` }
      : isWallet
        ? { state: 'wallet', title: action.step, message: 'Please confirm the transaction in your wallet' }
        : {
            state: 'checking',
            title: 'Checking Changes',
            message: 'Checking the resolver and simulating the transaction',
          }
    const steps: TxStep[] = [
      { key: 'action', label: action.step, status: isProcessing ? 'done' : 'active' },
      {
        key: 'onchain',
        label: 'Onchain Confirmation',
        status: isProcessing ? 'active' : 'upcoming',
        hash: isProcessing ? txHash : null,
      },
    ]

    return {
      key: 'progress',
      locked: true,
      subject: v2Subject(name, meta, true),
      body: (
        <>
          <TxStatus {...status} />
          <TxSteps steps={steps} />
        </>
      ),
      footerHint: isWallet ? undefined : KEEP_OPEN_HINT,
    }
  }

  if (step === 'success') {
    return {
      key: 'success',
      locked: false,
      subject: v2Subject(name, meta, false),
      body: (
        <>
          <TxStatus state='success' title='Changes Saved' message={input.successMessage}>
            {txHash && <TxLink hash={txHash} label={txLinkLabel(0, 1)} />}
          </TxStatus>
          {input.draftsRemain && (
            <GhostButton icon='pencil' onClick={input.onBack}>
              Back to Editor
            </GhostButton>
          )}
        </>
      ),
      footer: closeButton(input.onClose),
    }
  }

  if (step === 'error' && pending) {
    return {
      key: 'unconfirmed',
      locked: false,
      subject: v2Subject(name, meta, true),
      body: (
        <>
          <TxStatus state='error' title='Confirmation Unavailable' message={UNCONFIRMED_MESSAGE}>
            {txHash && <TxLink hash={txHash} label='View pending transaction' />}
          </TxStatus>
          {error && <ErrorNotice error={error} details={errorDetails} />}
        </>
      ),
      footer: retryFooter('Check Transaction', input.onCheck, input.onClose),
    }
  }

  if (step === 'error') {
    return {
      key: 'error',
      locked: false,
      subject: v2Subject(name, meta, true),
      body: (
        <>
          <TxStatus
            state='error'
            title='Changes Not Saved'
            message='Review the details below, then go back to the editor.'
          />
          <ErrorNotice error={error} details={errorDetails} />
          <GhostButton icon='sync' onClick={input.onReload}>
            Reload Records
          </GhostButton>
        </>
      ),
      footer: retryFooter('Back to Editor', input.onBack, input.onClose),
    }
  }

  return null
}

// ---------------------------------------------------------------------------------------------------------------
// V2 permissions (useV2RoleTransaction): one row, Save Permissions, with a batch counter and a pill per batch.

export interface RolesScreenInput {
  name: string
  step: 'editing' | 'confirming' | 'processing' | 'success' | 'error'
  phase: RoleTransactionPhase
  /** Transactions of the latest submit; 0 until its batches are built. */
  runTotal: number
  /** Hashes the latest submit confirmed. */
  hashes: string[]
  /** The hash in flight, or the one whose receipt never came. */
  submittedHash: string | null
  pending: boolean
  changeCount: number
  error: string | null
  errorDetails: string | null
  onBack: () => void
  onCheck: () => void
  onClose: () => void
}

export const getRolesScreen = (input: RolesScreenInput): TxScreen | null => {
  const { name, step, phase, runTotal, hashes, submittedHash, pending, changeCount, error, errorDetails } = input
  const display = beautifyName(name)
  const meta =
    [changeCount > 0 && plural(changeCount, 'permission change'), runTotal > 1 && plural(runTotal, 'transaction')]
      .filter(Boolean)
      .join(' · ') || undefined
  const confirmedLinks = (
    <NoticeLinks>
      {hashes.map((hash, index) => (
        <TxLink key={hash} hash={hash} label={`Transaction ${index + 1}`} />
      ))}
    </NoticeLinks>
  )
  const partialNotice = hashes.length > 0 && (
    <Notice tone='warning' title={`${hashes.length} of ${Math.max(runTotal, hashes.length)} transactions confirmed.`}>
      Those changes are saved. Unsaved edits remain queued in the editor.
      {confirmedLinks}
    </Notice>
  )

  if (step === 'confirming' || step === 'processing') {
    const isProcessing = step === 'processing'
    const isWallet = !isProcessing && phase === 'wallet'
    // The batch in flight is the one after those already confirmed.
    const position = hashes.length + 1
    const hasStarted = isProcessing || isWallet || hashes.length > 0
    const status: Status = isProcessing
      ? { state: 'pending', title: 'Saving Permissions', message: `${activeChain.name} · Waiting for confirmation` }
      : isWallet
        ? {
            state: 'wallet',
            title: 'Save Permissions',
            message:
              runTotal > 1
                ? `Transaction ${position} of ${runTotal}. Please confirm it in your wallet.`
                : 'Please confirm the transaction in your wallet.',
          }
        : {
            state: 'checking',
            title: 'Checking Permissions',
            message:
              hashes.length > 0
                ? `Checking transaction ${position} of ${runTotal} before the wallet prompt`
                : runTotal > 1
                  ? `Checking all ${runTotal} transactions before the first wallet prompt`
                  : runTotal === 1
                    ? 'Checking the transaction before the wallet prompt'
                    : 'Checking your permission changes',
          }
    const links = [...hashes, ...(isProcessing && submittedHash ? [submittedHash] : [])]

    return {
      key: 'progress',
      locked: true,
      subject: v2Subject(name, meta, true),
      body: (
        <>
          <TxStatus {...status} />
          <TxSteps
            steps={[
              {
                key: 'permissions',
                label: 'Save Permissions',
                status: hasStarted ? 'active' : 'upcoming',
                batch: hasStarted && runTotal > 1 ? `${position} / ${runTotal}` : undefined,
                links: links.map((hash) => ({ key: hash, hash })),
              },
            ]}
          />
        </>
      ),
      footerHint: isWallet ? undefined : KEEP_OPEN_HINT,
    }
  }

  if (step === 'success') {
    const message =
      changeCount > 1
        ? `All ${changeCount} permission changes on ${display} are saved.`
        : changeCount === 1
          ? `The permission change on ${display} is saved.`
          : `Your permission changes on ${display} are saved.`

    return {
      key: 'success',
      locked: false,
      subject: v2Subject(name, meta, false),
      body: (
        <>
          <TxStatus state='success' title='Permissions Saved' message={message}>
            <TxLinkList links={hashes.map((hash) => ({ key: hash, hash }))} />
          </TxStatus>
          <GhostButton icon='pencil' onClick={input.onBack}>
            Back to Editor
          </GhostButton>
        </>
      ),
      footer: closeButton(input.onClose),
    }
  }

  if (step === 'error' && pending) {
    return {
      key: 'unconfirmed',
      locked: false,
      subject: v2Subject(name, meta, true),
      body: (
        <>
          <TxStatus state='error' title='Confirmation Unavailable' message={UNCONFIRMED_MESSAGE}>
            {submittedHash && <TxLink hash={submittedHash} label='View pending transaction' />}
          </TxStatus>
          {partialNotice}
          {error && <ErrorNotice error={error} details={errorDetails} />}
        </>
      ),
      footer: retryFooter('Check Transaction', input.onCheck, input.onClose),
    }
  }

  if (step === 'error') {
    return {
      key: 'error',
      locked: false,
      subject: v2Subject(name, meta, true),
      body: (
        <>
          <TxStatus
            state='error'
            title={hashes.length > 0 ? 'Permissions Partly Saved' : 'Permissions Not Saved'}
            message='Review the details below, then go back to the editor.'
          />
          {partialNotice}
          <ErrorNotice error={error} details={errorDetails} />
        </>
      ),
      footer: retryFooter('Back to Editor', input.onBack, input.onClose),
    }
  }

  return null
}

// ---------------------------------------------------------------------------------------------------------------
// Bulk (useBulkEditRecords): one step per resolver, counting its 50-name transactions.

export const resolverLabel = (address: string) =>
  config.ensPublicResolver && address.toLowerCase() === config.ensPublicResolver.toLowerCase()
    ? 'Public Resolver'
    : `Resolver ${shortAddress(address)}`

const isRunning = (status: TransactionStatus) => status.status === 'confirming' || status.status === 'processing'
const countNames = (statuses: TransactionStatus[]) => statuses.reduce((count, status) => count + status.names.length, 0)

/** Transactions grouped by resolver, in the order they run. */
const groupByResolver = (statuses: TransactionStatus[]) => {
  const groups = new Map<string, { resolverAddress: string; indices: number[]; nameCount: number }>()

  statuses.forEach((status, index) => {
    const key = status.resolverAddress.toLowerCase()
    const group = groups.get(key) ?? { resolverAddress: status.resolverAddress, indices: [], nameCount: 0 }
    group.indices.push(index)
    group.nameCount += status.names.length
    groups.set(key, group)
  })

  return [...groups.values()]
}

export const getBulkSteps = (statuses: TransactionStatus[]): TxStep[] =>
  groupByResolver(statuses).map((group) => {
    const items = group.indices.map((index) => statuses[index])
    const activeAt = items.findIndex(isRunning)
    const isFinished = items.every((item) => item.status === 'success' || item.status === 'error')

    return {
      key: group.resolverAddress,
      label: `${resolverLabel(group.resolverAddress)} · ${plural(group.nameCount, 'name')}`,
      status:
        activeAt >= 0
          ? 'active'
          : isFinished
            ? items.some((item) => item.status === 'error')
              ? 'failed'
              : 'done'
            : 'upcoming',
      batch: items.length > 1 && activeAt >= 0 ? `${activeAt + 1} / ${items.length}` : undefined,
      links: items.flatMap((item, at) => (item.txHash ? [{ key: `${group.indices[at]}`, hash: item.txHash }] : [])),
    }
  })

export interface BulkScreenInput {
  /** The names this modal can update (the subject before any transaction is planned). */
  names: string[]
  step: BulkEditStep
  statuses: TransactionStatus[]
  error: string | null
  errorDetails: string | null
  onRetryTransaction: (index: number) => void
  /** Back to the form, as today. */
  onTryAgain: () => void
  onClose: () => void
}

export const getBulkScreen = (input: BulkScreenInput): TxScreen | null => {
  const { step, statuses, error, errorDetails, onRetryTransaction, onTryAgain, onClose } = input
  const running = statuses.some(isRunning)
  const subjectNames = statuses.length > 0 ? statuses.flatMap((status) => status.names) : input.names
  const nameTotal = subjectNames.length
  const resolverCount = groupByResolver(statuses).length
  const meta =
    statuses.length > 0 ? `${plural(resolverCount, 'resolver')} · ${plural(statuses.length, 'transaction')}` : undefined
  const subject =
    nameTotal === 1 ? (
      <AssetSummary
        name={beautifyName(subjectNames[0])}
        compact
        meta={meta}
        image={<NameTile name={subjectNames[0]} version={1} />}
      />
    ) : (
      <AssetSummary
        name={plural(nameTotal, 'name')}
        compact
        meta={meta}
        stack={subjectNames.slice(0, 3).map((name) => (
          <NameTile key={name} name={name} version={1} />
        ))}
      />
    )

  // A row's Retry runs while the hook stays on 'error', so a running transaction decides the screen.
  if (step === 'confirming' || step === 'processing' || running) {
    const activeIndex = statuses.findIndex(isRunning)
    const active = statuses[activeIndex]
    const updated = countNames(statuses.filter((status) => status.status === 'success'))
    const status: Status =
      active?.status === 'confirming'
        ? {
            state: 'wallet',
            title: 'Save Records',
            message:
              statuses.length > 1
                ? `Transaction ${activeIndex + 1} of ${statuses.length} on ${activeChain.name}. Please confirm it in your wallet.`
                : 'Please confirm the transaction in your wallet.',
          }
        : active?.status === 'processing'
          ? {
              state: 'pending',
              title: 'Saving Records',
              message: `${activeChain.name} · Updating ${updated}/${nameTotal} names...`,
            }
          : { state: 'checking', title: 'Saving Records', message: 'Preparing the transactions' }

    return {
      key: 'progress',
      locked: true,
      subject,
      body: (
        <>
          <TxStatus {...status} />
          {active && <NameChips names={active.names.map(beautifyName)} max={4} />}
          {statuses.length > 0 && <TxSteps steps={getBulkSteps(statuses)} />}
        </>
      ),
      footerHint: active?.status === 'confirming' ? undefined : KEEP_OPEN_HINT,
    }
  }

  if (step === 'success') {
    const links = statuses.flatMap((status, index) => (status.txHash ? [{ key: `${index}`, hash: status.txHash }] : []))

    return {
      key: 'success',
      locked: false,
      body: (
        <TxStatus
          state='success'
          title='Records Updated'
          message={nameTotal === 1 ? `${beautifyName(subjectNames[0])} updated.` : `${nameTotal} names updated.`}
        >
          <TxLinkList links={links} />
        </TxStatus>
      ),
      footer: closeButton(onClose),
    }
  }

  if (step === 'error') {
    const failed = statuses.flatMap((status, index) => (status.status === 'error' ? [{ status, index }] : []))
    const confirmed = statuses.filter((status) => status.status === 'success')

    // Nothing was sent (wallet, network or an empty plan): one message.
    if (failed.length === 0) {
      return {
        key: 'error',
        locked: false,
        subject,
        body: (
          <>
            <TxStatus state='error' title='Records Not Updated' message='Review the details below and try again.' />
            <ErrorNotice error={error} details={errorDetails} />
          </>
        ),
        footer: retryFooter('Try Again', onTryAgain, onClose),
      }
    }

    const updated = countNames(confirmed)
    const retryLine = `Retry the failed transaction${failed.length > 1 ? 's' : ''} below.`

    return {
      key: 'error',
      locked: false,
      subject,
      body: (
        <>
          <TxStatus
            state='error'
            title={updated > 0 ? 'Some Records Not Updated' : 'Records Not Updated'}
            message={
              updated > 0
                ? `${updated} of ${nameTotal} names were updated. ${retryLine}`
                : `No names were updated. ${retryLine}`
            }
          />
          {failed.map(({ status, index }) => (
            <Notice
              key={index}
              tone='danger'
              title={`${resolverLabel(status.resolverAddress)} · ${plural(status.names.length, 'name')}`}
              details={status.details}
            >
              {status.error || 'Transaction failed'}
              <span className='mt-1 flex'>
                <GhostButton icon='sync' className='mx-0 -ml-3' onClick={() => onRetryTransaction(index)}>
                  Retry
                </GhostButton>
              </span>
            </Notice>
          ))}
          {confirmed.length > 0 && (
            <Notice tone='success' title={`${confirmed.length} of ${statuses.length} transactions confirmed.`}>
              <span className='flex flex-wrap gap-1.5'>
                {statuses.map((status, index) =>
                  status.status === 'success' && status.txHash ? <TxLink key={index} hash={status.txHash} /> : null
                )}
              </span>
            </Notice>
          )}
        </>
      ),
      footer: retryFooter('Try Again', onTryAgain, onClose),
    }
  }

  return null
}

// ---------------------------------------------------------------------------------------------------------------
// Image upload (imageUploadModal, file mode): Sign Upload · Upload Image.

export type UploadPhase = 'signing' | 'uploading' | 'error'

export interface UploadScreenInput {
  name: string
  imageType: 'avatar' | 'header'
  phase: UploadPhase
  fileName: string | null
  fileSize: number | null
  preview: string | null
  error: string | null
  errorDetails: string | null
  /** The euc.li response status, for the hint under "Upload Failed". */
  errorStatus: number | null
  /** Back to the form, the file kept. */
  onTryAgain: () => void
  onCancel: () => void
}

const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

export const getUploadScreen = (input: UploadScreenInput): TxScreen => {
  const { name, imageType, phase, fileName, fileSize, preview, error, errorDetails, errorStatus } = input
  const display = beautifyName(name)
  const subject = (
    <AssetSummary
      name={fileName ?? `${imageType === 'avatar' ? 'Avatar' : 'Header'} image`}
      compact
      meta={[display, fileSize !== null && formatFileSize(fileSize)].filter(Boolean).join(' · ')}
      image={
        preview ? (
          <Image src={preview} alt='' width={48} height={48} unoptimized className='h-full w-full object-cover' />
        ) : undefined
      }
    />
  )

  if (phase === 'error') {
    return {
      key: 'error',
      locked: false,
      subject,
      body: (
        <>
          <TxStatus
            state='error'
            title='Upload Failed'
            message={
              errorStatus === 413
                ? 'Choose a smaller file and try again.'
                : errorStatus === 415
                  ? 'Choose a JPG or JPEG file and try again.'
                  : 'Review the details below and try again.'
            }
          />
          <ErrorNotice error={error} details={errorDetails} />
        </>
      ),
      footer: retryFooter('Try Again', input.onTryAgain, input.onCancel, 'Cancel'),
    }
  }

  const isSigning = phase === 'signing'
  const status: Status = isSigning
    ? { state: 'wallet', title: 'Sign Upload', message: 'Please sign in your wallet. Signing costs no gas.' }
    : { state: 'pending', title: 'Uploading Image', message: `Uploading ${fileName ?? 'your image'} for ${display}` }

  return {
    key: 'progress',
    locked: true,
    subject,
    body: (
      <>
        <TxStatus {...status} />
        <TxSteps
          steps={[
            { key: 'sign', label: 'Sign Upload', status: isSigning ? 'active' : 'done' },
            { key: 'upload', label: 'Upload Image', status: isSigning ? 'upcoming' : 'active' },
          ]}
        />
      </>
    ),
    footerHint: isSigning ? undefined : 'Keep this window open until the upload finishes.',
  }
}
