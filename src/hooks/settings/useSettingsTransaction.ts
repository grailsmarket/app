import { useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import type { Address, Chain, Hex, PublicClient } from 'viem'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { createV2RecordsClient } from '@/utils/records/client'
import { prepareSettingsTransaction, type SettingsTransactionStep } from '@/utils/settings/transaction'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { activeChain } from '@/constants/web3/chain'
import { useSettingsTransactionDialog } from '@/context/settingsTransaction'

export type { SettingsTransactionStep } from '@/utils/settings/transaction'

interface SettingsTransactionOptions {
  client: PublicClient
  chain: Chain
}

export const useSettingsTransaction = (options?: SettingsTransactionOptions) => {
  const { address } = useAccount()
  const getWallet = useGetWalletClient()
  const defaultClient = useMemo(createV2RecordsClient, [])
  const client = options?.client ?? defaultClient
  const chain = options?.chain ?? activeChain
  const queries = useQueryClient()
  const locked = useRef(false)
  const requestedSteps = useRef<SettingsTransactionStep[]>([])
  const queue = useRef<{
    steps: SettingsTransactionStep[]
    index: number
    account: Address
    client: PublicClient
    chain: Chain
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
      if (!queue.current) queue.current = { steps: requestedSteps.current, index: 0, account: address, client, chain }

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
            client: work.client,
            chain: work.chain,
            getWallet,
            onStatus: (status) => setState({ phase: 'preparing', status, label: step.label, progress }),
          })

          if (!prepared) {
            work.index++
            continue
          }

          const { request, wallet } = prepared
          setState({ phase: 'confirming', label: step.label, progress })
          work.hash = await wallet.sendTransaction({ ...request, account: wallet.account!, chain: work.chain })
        }

        setState({ phase: 'processing', label: step.label, hash: work.hash, progress })
        const receipt = await waitForTransaction(work.client, work.hash)
        work.hash = undefined
        if (receipt.status !== 'success') throw new Error('The transaction reverted. Its changes were not saved.')
        work.index++
        // Receipt callbacks update local UI only; indexing and preference failures must never resubmit a confirmed write.
        for (const key of [
          ['settings'],
          ['v2-records'],
          ['v2-roles'],
          ['user', 'resolvers'],
          ['registration', 'resolver'],
        ])
          void queries.invalidateQueries({ queryKey: key })
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

  const transactionChain = queue.current?.chain ?? chain
  const explorerUrl =
    state.hash && transactionChain.blockExplorers
      ? `${transactionChain.blockExplorers.default.url}/tx/${state.hash}`
      : null

  useSettingsTransactionDialog({
    open: state.phase !== 'idle',
    phase: state.phase === 'idle' ? 'confirming' : state.phase,
    title: state.label ?? 'Save changes',
    networkName: transactionChain.name,
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
