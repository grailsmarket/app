import { useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import type { Address, Hex, TransactionReceipt, WalletClient } from 'viem'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { roleErrorText } from '@/hooks/records/useV2Roles'
import { createV2RecordsClient } from '@/utils/records/client'
import { ensureChain } from '@/utils/web3/ensureChain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { activeChain } from '@/constants/web3/chain'

export type SettingsTransactionStep = {
  label: string
  prepare: (account: Address) => Promise<{ to: Address; data: Hex } | null>
  confirmed?: (receipt: TransactionReceipt) => void
}

export const useSettingsTransaction = () => {
  const { address } = useAccount()
  const getWallet = useGetWalletClient()
  const client = useMemo(createV2RecordsClient, [])
  const queries = useQueryClient()
  const locked = useRef(false)
  const queue = useRef<{ steps: SettingsTransactionStep[]; index: number; account: Address; hash?: Hex } | null>(null)
  const [state, setState] = useState<{
    phase: 'idle' | 'confirming' | 'processing' | 'success' | 'error'
    label?: string
    error?: string
    hash?: Hex
  }>({ phase: 'idle' })
  const run = async (steps: SettingsTransactionStep[] = []) => {
    if (locked.current) return false
    locked.current = true
    try {
      if (!address) throw new Error('Connect your wallet before continuing.')
      if (!queue.current) queue.current = { steps, index: 0, account: address }
      const work = queue.current
      if (work.account.toLowerCase() !== address.toLowerCase())
        throw new Error('Reconnect the wallet that started this transaction.')
      let wallet: WalletClient | undefined
      while (work.index < work.steps.length) {
        const step = work.steps[work.index]
        if (!work.hash) {
          setState({ phase: 'confirming', label: step.label })
          wallet = await getWallet()
          if (wallet.account?.address.toLowerCase() !== work.account.toLowerCase())
            throw new Error('The connected wallet changed.')
          await ensureChain(wallet, activeChain.id)
          const request = await step.prepare(work.account)
          if (!request) {
            work.index++
            continue
          }
          await client.call({ account: work.account, ...request })
          work.hash = await wallet.sendTransaction({ ...request, account: wallet.account!, chain: activeChain })
        }
        setState({ phase: 'processing', label: step.label, hash: work.hash })
        const receipt = await waitForTransaction(client, work.hash)
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
    setState({ phase: 'idle' })
  }
  return {
    ...state,
    run,
    reset,
    busy: state.phase === 'confirming' || state.phase === 'processing',
    pending: !!queue.current,
    submitted: !!queue.current?.hash,
    explorerUrl: state.hash ? `${activeChain.blockExplorers.default.url}/tx/${state.hash}` : null,
  }
}
