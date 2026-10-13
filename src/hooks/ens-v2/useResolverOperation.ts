'use client'

import { useState, useEffect } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Address, Hex, PublicClient, TransactionReceipt, WalletClient } from 'viem'
import { activeChain } from '@/constants/web3/chain'
import { ensApi } from '@/api/ens-v2'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { useEnsV2 } from '@/hooks/useEnsV2'
import { useDraftGuard } from './useDraftGuard'
import type { EnsV2Contracts } from '@/utils/web3/ensv2'

import { rememberEnsTransaction, forgetEnsTransaction, pendingEnsTransactions } from '@/utils/web3/transaction-journal'
import { waitForTransaction } from '@/utils/web3/safeTransaction'

export interface OperationContext {
  client: PublicClient
  wallet: WalletClient
  account: Address
  v2: EnsV2Contracts
  onHash: (hash: Hex) => void
}
export interface OperationResult {
  receipt: TransactionReceipt
  anchor?: Hex
  recordId?: string
  resolver?: Address
}

export function useResolverOperation() {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: activeChain.id })
  const getWallet = useGetWalletClient()
  const v2 = useEnsV2()
  const queryClient = useQueryClient()
  const [hash, setHash] = useState<Hex | null>(null)
  const [syncWarning, setSyncWarning] = useState<string | null>(null)
  const [unconfirmed, setUnconfirmed] = useState<Hex | null>(null)
  const mutation = useMutation({
    mutationFn: async (operation: (context: OperationContext) => Promise<OperationResult>) => {
      if (!client || !address || !v2) throw new Error('Connect a wallet on a supported ENSv2 network.')
      if (unconfirmed)
        throw new Error('A transaction is still pending. Check it in Settings before submitting another operation.')
      setHash(null)
      setSyncWarning(null)
      const wallet = await getWallet()
      if (wallet.account.address.toLowerCase() !== address.toLowerCase())
        throw new Error('The connected wallet changed. Review the operation again.')
      let submitted: Hex | null = null
      let result: OperationResult
      const onHash = (tx: Hex) => {
        submitted = tx
        setHash(tx)
        setUnconfirmed(tx)
        rememberEnsTransaction({ hash: tx, wallet: address, chainId: activeChain.id, submittedAt: Date.now() })
      }
      try {
        result = await operation({ client, wallet, account: address, v2, onHash })
      } catch (cause) {
        if (submitted) {
          const receipt = await client.getTransactionReceipt({ hash: submitted }).catch(() => null)
          if (receipt) {
            forgetEnsTransaction(submitted)
            setUnconfirmed(null)
            if (receipt.status === 'success')
              setSyncWarning(
                'A transaction confirmed before the next step failed. Its effect is already onchain; refresh and resume the remaining step.'
              )
          }
        }
        throw cause
      }
      forgetEnsTransaction(submitted ?? result.receipt.transactionHash)
      setUnconfirmed(null)
      try {
        await ensApi.refresh(activeChain.id, result.receipt.transactionHash, result.anchor)
      } catch {
        setSyncWarning(
          'Confirmed onchain. The indexing service has not refreshed yet; do not submit the transaction again.'
        )
      }
      return result
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['ens-v2'] }),
        queryClient.invalidateQueries({ queryKey: ['name'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
      ])
    },
  })
  useDraftGuard(false, mutation.isPending)
  useEffect(() => {
    if (!mutation.isSuccess) return
    let count = 0
    const timer = setInterval(() => {
      void queryClient.invalidateQueries({ queryKey: ['ens-v2'] })
      if (++count >= 12) clearInterval(timer)
    }, 5000)
    return () => clearInterval(timer)
  }, [mutation.isSuccess, queryClient])
  useEffect(() => {
    const update = () => {
      if (unconfirmed && !pendingEnsTransactions().some((item) => item.hash === unconfirmed)) setUnconfirmed(null)
    }
    window.addEventListener('ens-transactions', update)
    return () => window.removeEventListener('ens-transactions', update)
  }, [unconfirmed])
  const checkPending = async () => {
    if (!unconfirmed || !client) return
    const receipt = await waitForTransaction(client, unconfirmed)
    forgetEnsTransaction(unconfirmed)
    setUnconfirmed(null)
    await queryClient.invalidateQueries({ queryKey: ['ens-v2'] })
    setSyncWarning(
      receipt.status === 'success'
        ? 'Confirmed onchain. Refresh the configuration before making further changes.'
        : 'The pending transaction reverted. It can be retried.'
    )
  }
  return { ...mutation, hash, syncWarning, unconfirmed, checkPending }
}
