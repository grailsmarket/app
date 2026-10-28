import { useEffect, useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import type { Address, Hex } from 'viem'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { createV2RecordsClient } from '@/utils/records/client'
import {
  prepareSettingsTransaction,
  type SettingsTransactionStep as PreparedSettingsTransactionStep,
} from '@/utils/settings/transaction'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { activeChain } from '@/constants/web3/chain'
import { useSettingsTransactionDialog } from '@/context/settingsTransaction'
import { refreshEnsQueries } from '@/utils/refreshEnsQueries'

export interface SettingsTransactionStep extends PreparedSettingsTransactionStep {
  pendingLabel?: string
  note?: string
}

export interface SettingsTransactionCopy {
  title?: string
  successTitle?: string
  successMessage?: string
  errorTitle?: string
}

export interface SettingsTransactionStepState {
  label: string
  pendingLabel?: string
  note?: string
  hash?: Hex
  skipped?: boolean
}

type StepResult = { hash?: Hex; skipped?: boolean }

const describeSteps = (steps: SettingsTransactionStep[], results: StepResult[] = []): SettingsTransactionStepState[] =>
  steps.map((step, index) => ({
    label: step.label,
    pendingLabel: step.pendingLabel,
    note: step.note,
    hash: results[index]?.hash,
    skipped: results[index]?.skipped,
  }))

export const useSettingsTransaction = (
  copy: SettingsTransactionCopy = {},
  onClose?: (txCompleted?: boolean) => void
) => {
  const { address } = useAccount()
  const getWallet = useGetWalletClient()
  const client = useMemo(createV2RecordsClient, [])
  const queries = useQueryClient()
  const requestedSteps = useRef<SettingsTransactionStep[]>([])
  const requestedCopy = useRef<SettingsTransactionCopy>({})
  const queue = useRef<{
    steps: SettingsTransactionStep[]
    index: number
    account: Address
    hash?: Hex
    results: StepResult[]
    running?: boolean
    submitting?: boolean
  } | null>(null)

  useEffect(
    () => () => {
      queue.current = null
    },
    []
  )

  const [state, setState] = useState<{
    phase: 'idle' | 'preparing' | 'confirming' | 'processing' | 'success' | 'error'
    status?: string
    label?: string
    error?: string
    details?: string
    hash?: Hex
    progress?: { current: number; total: number }
    steps?: SettingsTransactionStepState[]
    index?: number
    copy?: SettingsTransactionCopy
  }>({ phase: 'idle' })

  const run = async (steps: SettingsTransactionStep[] = [], runCopy?: SettingsTransactionCopy) => {
    if (queue.current?.running) return false
    if (steps.length) {
      requestedSteps.current = steps
      requestedCopy.current = runCopy ?? {}
    }

    const reportCopy = requestedCopy.current
    const queued = queue.current
    const work = queued ?? (address ? { steps: requestedSteps.current, index: 0, account: address, results: [] } : null)
    queue.current = work
    if (work) work.running = true
    const isCurrent = () => queue.current === work
    const preview = {
      copy: reportCopy,
      label: (queued?.steps ?? requestedSteps.current)[queued?.index ?? 0]?.label,
      steps: queued ? describeSteps(queued.steps, queued.results) : describeSteps(requestedSteps.current),
      index: queued?.index ?? 0,
    }

    setState((previous) => ({
      ...previous,
      ...preview,
      label: preview.label ?? previous.label,
      phase: 'preparing',
      status: 'Preparing transaction…',
      error: undefined,
      details: undefined,
    }))

    try {
      if (!address || !work) throw new Error('Connect your wallet before continuing.')
      const report = () => ({
        copy: reportCopy,
        steps: describeSteps(work.steps, work.results),
        index: work.index,
      })

      if (work.account.toLowerCase() !== address.toLowerCase())
        throw new Error('Reconnect the wallet that started this transaction.')

      while (work.index < work.steps.length) {
        if (!isCurrent()) return false
        const step = work.steps[work.index]
        const progress = { current: work.index + 1, total: work.steps.length }

        if (!work.hash) {
          const prepared = await prepareSettingsTransaction({
            step,
            account: work.account,
            client,
            chain: activeChain,
            getWallet,
            isCurrent,
            onStatus: (status) => setState({ phase: 'preparing', status, label: step.label, progress, ...report() }),
          })
          if (!isCurrent()) return false

          if (!prepared) {
            work.results[work.index] = { skipped: true }
            work.index++
            continue
          }

          const { request, wallet } = prepared
          setState({ phase: 'confirming', label: step.label, progress, ...report() })
          work.submitting = true
          try {
            work.hash = await wallet.sendTransaction({ ...request, account: wallet.account!, chain: activeChain })
          } finally {
            work.submitting = false
          }
          work.results[work.index] = { hash: work.hash }
        }

        setState({ phase: 'processing', label: step.label, hash: work.hash, progress, ...report() })
        const receipt = await waitForTransaction(client, work.hash)
        work.hash = undefined

        if (receipt.status !== 'success') throw new Error('The transaction reverted. Its changes were not saved.')
        step.verifyReceipt?.(receipt)

        work.index++
        // Receipt callbacks update local UI only; indexing and preference failures must never resubmit a confirmed write.
        refreshEnsQueries(queries, receipt)
        step.confirmed?.(receipt)
      }

      if (!isCurrent()) return false
      queue.current = null
      const done = report()
      setState((previous) => ({ ...previous, ...done, phase: 'success', error: undefined }))
      return true
    } catch (error) {
      if (!isCurrent()) return false
      const message = roleErrorText(error)
      const reached = work ? { steps: describeSteps(work.steps, work.results), index: work.index } : {}
      setState((previous) => ({
        ...previous,
        ...reached,
        phase: 'error',
        error: message,
        details: error instanceof Error && error.message !== message ? error.message : undefined,
        hash: work?.hash ?? previous.hash,
      }))
      return false
    } finally {
      if (work) work.running = false
    }
  }

  const reset = () => {
    if (queue.current?.submitting || queue.current?.hash) return
    queue.current = null
    requestedSteps.current = []
    setState({ phase: 'idle' })
    onClose?.(state.phase === 'success')
  }

  const explorerUrl = state.hash ? `${activeChain.blockExplorers.default.url}/tx/${state.hash}` : null
  const shown = { ...copy, ...state.copy }

  useSettingsTransactionDialog({
    open: state.phase !== 'idle',
    phase: state.phase === 'idle' ? 'confirming' : state.phase,
    title: shown.title ?? state.steps?.[0]?.label ?? 'Save Changes',
    label: state.label,
    networkName: activeChain.name,
    status: state.status,
    error: state.error,
    details: state.details,
    hash: state.hash,
    explorerUrl,
    progress: state.progress,
    steps: state.steps,
    index: state.index,
    successTitle: shown.successTitle,
    successMessage: shown.successMessage,
    errorTitle: shown.errorTitle,
    submitted: !!queue.current?.hash,
    onRetry: () => void run(),
    onClose: reset,
  })

  return {
    ...state,
    run,
    reset,
    busy: state.phase === 'preparing' || state.phase === 'confirming' || state.phase === 'processing',
    pending: !!queue.current,
    submitted: !!queue.current?.hash,
    explorerUrl,
  }
}
