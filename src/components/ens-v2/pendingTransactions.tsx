'use client'

import { useEffect, useState } from 'react'
import { useAccount, usePublicClient } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { activeChain, EXPLORER_URL } from '@/constants/web3/chain'
import {
  pendingEnsTransactions,
  forgetEnsTransaction,
  type PendingEnsTransaction,
} from '@/utils/web3/transaction-journal'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { ensApi } from '@/api/ens-v2'
import { buttonClass, Notice } from './ui'

export default function PendingTransactions() {
  const { address } = useAccount()
  const client = usePublicClient({ chainId: activeChain.id })
  const cache = useQueryClient()
  const [pending, setPending] = useState<PendingEnsTransaction[]>([])
  const [checking, setChecking] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  useEffect(() => {
    const refresh = () =>
      setPending(
        pendingEnsTransactions().filter(
          (item) => item.chainId === activeChain.id && item.wallet.toLowerCase() === address?.toLowerCase()
        )
      )
    refresh()
    window.addEventListener('ens-transactions', refresh)
    return () => window.removeEventListener('ens-transactions', refresh)
  }, [address])
  return (
    <>
      {pending.map((item) => (
        <Notice key={item.hash}>
          <p>A previously submitted ENS transaction needs confirmation.</p>
          <a className='underline' target='_blank' rel='noreferrer' href={`${EXPLORER_URL}/tx/${item.hash}`}>
            View submitted transaction
          </a>
          <button
            className={`${buttonClass} ml-3`}
            disabled={!!checking || !client}
            onClick={async () => {
              setChecking(item.hash)
              setMessage(null)
              try {
                const receipt = await waitForTransaction(client!, item.hash)
                forgetEnsTransaction(item.hash)
                if (receipt.status === 'success') {
                  await ensApi.refresh(activeChain.id, receipt.transactionHash, item.anchor).catch(() => undefined)
                  await cache.invalidateQueries({ queryKey: ['ens-v2'] })
                  setMessage('Transaction confirmed. Refresh the affected name or configuration before continuing.')
                } else setMessage('The transaction reverted; its changes were not applied.')
              } catch (cause) {
                setMessage(cause instanceof Error ? cause.message : 'Could not check this transaction.')
              } finally {
                setChecking(null)
              }
            }}
          >
            {checking === item.hash ? 'Checking…' : 'Check confirmation'}
          </button>
        </Notice>
      ))}
      {message && <Notice>{message}</Notice>}
    </>
  )
}
