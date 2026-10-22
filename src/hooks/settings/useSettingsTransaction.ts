import { useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import type { Address, Hex } from 'viem'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { createV2RecordsClient } from '@/utils/records/client'
import { prepareSettingsTransaction, type SettingsTransactionStep } from '@/utils/settings/transaction'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { activeChain } from '@/constants/web3/chain'
import { useSettingsTransactionDialog } from '@/context/settingsTransaction'
import { refreshEnsQueries } from '@/utils/refreshEnsQueries'

export type { SettingsTransactionStep } from '@/utils/settings/transaction'

export const useSettingsTransaction = () => {
  const { address } = useAccount()
  const getWallet = useGetWalletClient()
  const client = useMemo(createV2RecordsClient, [])
  const queries = useQueryClient()
  const locked = useRef(false)
  const requestedSteps = useRef<SettingsTransactionStep[]>([])
  const queue = useRef<{
    steps: SettingsTransactionStep[]
    index: number
    account: Address
    hash?: Hex
  } | null>(null)
  const [state, setState] = useState<{
    phase: 'idle' | 'preparing' | 'confirming' | 'processing' | 'success' | 'error'
    status?: string
    label?: string
    error?: string
    hash?: Hex
    progress?: { current: number; total: number }
  }>({ phase: 'idle' })

  const run = async (steps: SettingsTransactionStep[] = []) => {
    if (locked.current) return false

    locked.current = true
    if (steps.length) requestedSteps.current = steps

    setState((previous) => ({ ...previous, phase: 'preparing', status: 'Preparing transaction…', error: undefined }))

    try {
      if (!address) throw new Error('Connect your wallet before continuing.')
      if (!queue.current) queue.current = { steps: requestedSteps.current, index: 0, account: address }

      const work = queue.current
      if (work.account.toLowerCase() !== address.toLowerCase())
        throw new Error('Reconnect the wallet that started this transaction.')

      while (work.index < work.steps.length) {
        const step = work.steps[work.index]
        const progress = { current: work.index + 1, total: work.steps.length }

        if (!work.hash) {
          const prepared = await prepareSettingsTransaction({
            step,
            account: work.account,
            client,
            chain: activeChain,
            getWallet,
            onStatus: (status) => setState({ phase: 'preparing', status, label: step.label, progress }),
          })

          if (!prepared) {
            work.index++
            continue
          }

          const { request, wallet } = prepared
          setState({ phase: 'confirming', label: step.label, progress })
          work.hash = await wallet.sendTransaction({ ...request, account: wallet.account!, chain: activeChain })
        }

        setState({ phase: 'processing', label: step.label, hash: work.hash, progress })
        const receipt = await waitForTransaction(client, work.hash)
        work.hash = undefined
        if (receipt.status !== 'success') throw new Error('The transaction reverted. Its changes were not saved.')
        work.index++
        // Receipt callbacks update local UI only; indexing and preference failures must never resubmit a confirmed write.
        refreshEnsQueries(queries, receipt)
        step.confirmed?.(receipt)
      }

      queue.current = null
      setState((previous) => ({ ...previous, phase: 'success', error: undefined }))
      return true
    } catch (error) {
      setState((previous) => ({
        ...previous,
        phase: 'error',
        error: roleErrorText(error),
        hash: queue.current?.hash ?? previous.hash,
      }))
      return false
    } finally {
      locked.current = false
    }
  }

  const reset = () => {
    if (locked.current || queue.current?.hash) return

    queue.current = null
    requestedSteps.current = []
    setState({ phase: 'idle' })
  }

  const explorerUrl = state.hash ? `${activeChain.blockExplorers.default.url}/tx/${state.hash}` : null

  useSettingsTransactionDialog({
    open: state.phase !== 'idle',
    phase: state.phase === 'idle' ? 'confirming' : state.phase,
    title: state.label ?? 'Save changes',
    networkName: activeChain.name,
    status: state.status,
    error: state.error,
    explorerUrl,
    progress: state.progress,
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
