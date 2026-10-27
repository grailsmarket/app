'use client'

import { useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Address, Hex, isAddress, zeroAddress } from 'viem'
import { fetchAccount } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { setTransferModalDomains, TransferDomainType } from '@/state/reducers/modals/transferModal'
import { clearBulkSelect, removeBulkSelectDomain, selectBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import useTransferDomains from '@/hooks/registrar/useTransferDomains'
import { useDebounce } from '@/hooks/useDebounce'
import { accountQueryKey } from '@/utils/queryKeys'
import { getTransferDomainKey, getTransferError } from '@/utils/transfer'
import { activeChain } from '@/constants/web3/chain'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { refreshEnsQueries } from '@/utils/refreshEnsQueries'
import type { TransferBatch, TransferStep, TransferTransaction } from '@/types/transfer'
import { config } from '@/lib/config'

type PendingTransaction = TransferTransaction &
  ({ kind: 'approval'; contractName: string } | { kind: 'transfer'; batch: TransferBatch })

/** What the transaction being confirmed onchain is for. */
export type TransferProcessingKind = PendingTransaction['kind']

/** An operator approval sent in this run, in order. `hash` is null until the wallet returns it. */
export interface TransferApproval {
  contractName: string
  hash: Hex | null
}

/** The batch being signed or confirmed onchain. */
export interface TransferActiveBatch {
  version: 1 | 2
  names: string[]
}

/** Transfer transactions planned per name version, counting the ones finished in earlier runs. */
export type TransferBatchTotals = Record<1 | 2, number>

const UNCONFIRMED_MESSAGE =
  'The transaction was submitted, but confirmation is unavailable. Check the transaction to continue without submitting it again.'

const toActiveBatch = (batch: TransferBatch): TransferActiveBatch => ({
  version: batch.version,
  names: batch.entries.map((entry) => entry.domain.name),
})

export const useTransferModal = (domains: TransferDomainType[], onClose: () => void) => {
  const dispatch = useAppDispatch()
  const { address } = useAccount()
  const { isSelecting, domains: selectedDomains } = useAppSelector(selectBulkSelect)
  const queryClient = useQueryClient()
  const { prepareBatches, getRequiredApprovals, approve, simulate, transfer, publicClient } = useTransferDomains()
  const [step, setStep] = useState<TransferStep>('review')
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [recipientInput, setRecipientInput] = useState('')
  const input = recipientInput.trim()
  const debouncedInput = useDebounce(input, 200)
  const [target, setTarget] = useState<{ sender: Address; recipient: Address } | null>(null)
  const [transaction, setTransaction] = useState<TransferTransaction | null>(null)
  const [completedTransactions, setCompletedTransactions] = useState<TransferTransaction[]>([])
  const [completedNames, setCompletedNames] = useState<Set<string>>(new Set())
  const [approvingContract, setApprovingContract] = useState('')
  const [currentBatch, setCurrentBatch] = useState(1)
  const [totalBatches, setTotalBatches] = useState(1)
  const [hasPendingTransaction, setHasPendingTransaction] = useState(false)
  const [processingKind, setProcessingKind] = useState<TransferProcessingKind | null>(null)
  const [approvals, setApprovals] = useState<TransferApproval[]>([])
  const [activeBatch, setActiveBatch] = useState<TransferActiveBatch | null>(null)
  const [batchTotals, setBatchTotals] = useState<TransferBatchTotals | null>(null)
  const pending = useRef<PendingTransaction | null>(null)
  const submitting = useRef(false)

  const accountQuery = useQuery({
    queryKey: accountQueryKey(debouncedInput),
    queryFn: async () => {
      if (!isAddress(debouncedInput) && !debouncedInput.includes('.')) return null
      const account = await fetchAccount(debouncedInput)
      return isAddress(account?.address ?? '') ? account : null
    },
    enabled: !!debouncedInput && !target,
    retry: false,
  })
  // A new input must never submit to the previously resolved ENS recipient during debounce.
  const account = input === debouncedInput ? accountQuery.data : null
  const resolvedRecipient = isAddress(input) ? input : (account?.address as Address | undefined)
  const recipient = target?.recipient ?? resolvedRecipient
  const isResolving = !!input && !isAddress(input) && (input !== debouncedInput || accountQuery.isFetching)
  const recipientError =
    recipient === zeroAddress
      ? 'Choose a recipient other than the zero address.'
      : recipient && recipient.toLowerCase() === (target?.sender ?? address)?.toLowerCase()
        ? 'Choose a recipient other than your own wallet.'
        : input && !recipient && !isResolving
          ? 'Enter a valid address or an ENS name that resolves to an address.'
          : null
  const walletMismatch = !!target && target.sender.toLowerCase() !== address?.toLowerCase()
  const remainingDomains = domains.filter((domain) => !completedNames.has(getTransferDomainKey(domain)))
  const isBusy = step === 'preparing' || step === 'approving' || step === 'confirming' || step === 'processing'

  const handleTransfer = async () => {
    if (submitting.current || !domains.length) return
    if (!pending.current && (!address || !recipient || recipientError || isResolving || walletMismatch)) return

    const transferTarget = target ?? (address && recipient ? { sender: address, recipient } : null)
    if (!transferTarget) return

    submitting.current = true
    setTarget(transferTarget)
    setStep('preparing')
    setError(null)
    setErrorDetails(null)

    const succeeded = new Set(completedNames)
    // Finished transfer transactions per version, including earlier runs, for the batch counters.
    const finished: TransferBatchTotals = {
      1: completedTransactions.filter((transaction) => transaction.version === 1).length,
      2: completedTransactions.filter((transaction) => transaction.version === 2).length,
    }
    const resumed = pending.current
    setApprovals(resumed?.kind === 'approval' ? [{ contractName: resumed.contractName, hash: resumed.hash }] : [])

    const confirmPending = async () => {
      const current = pending.current
      if (!current) return

      setTransaction(current)
      setProcessingKind(current.kind)
      if (current.kind === 'transfer') setActiveBatch(toActiveBatch(current.batch))
      setStep('processing')

      const receipt = await waitForTransaction(publicClient, current.hash)
      pending.current = null

      setHasPendingTransaction(false)

      if (receipt.status !== 'success') {
        throw new Error(current.kind === 'approval' ? 'Transfer approval reverted.' : 'Transfer transaction reverted.')
      }

      if (current.kind === 'transfer') {
        finished[current.version] += 1
        refreshEnsQueries(queryClient, receipt)
        setCompletedTransactions((transactions) => [
          ...transactions,
          { version: current.version, hash: receipt.transactionHash },
        ])

        current.batch.entries.forEach(({ domain }) => {
          succeeded.add(getTransferDomainKey(domain))
          const selected = selectedDomains.find((item) => getTransferDomainKey(item) === getTransferDomainKey(domain))
          if (selected) dispatch(removeBulkSelectDomain(selected))
        })

        setCompletedNames(new Set(succeeded))
      }
    }

    try {
      await confirmPending()
      // A resumed transaction has confirmed; the names are read and simulated again from here.
      setStep('preparing')
      const remaining = domains.filter((domain) => !succeeded.has(getTransferDomainKey(domain)))
      const batches = await prepareBatches(remaining, transferTarget.sender)
      setTotalBatches(batches.length)
      setBatchTotals({
        1: finished[1] + batches.filter((batch) => batch.version === 1).length,
        2: finished[2] + batches.filter((batch) => batch.version === 2).length,
      })

      await Promise.all(batches.map((batch) => simulate(batch, transferTarget.sender, transferTarget.recipient)))

      for (let index = 0; index < batches.length; index++) {
        const batch = batches[index]

        setCurrentBatch(index + 1)

        const requiredApprovals = await getRequiredApprovals(batch, transferTarget.sender)

        for (const contract of requiredApprovals) {
          const contractName = contract === config.ensNameWrapper ? 'Name Wrapper' : 'ENS Registrar'
          setApprovingContract(contractName)
          setApprovals((list) => [...list, { contractName, hash: null }])
          setTransaction(null)
          setStep('approving')

          const hash = await approve(contract, transferTarget.sender)
          pending.current = { kind: 'approval', version: 1, hash, contractName }
          setApprovals((list) => list.map((item, i) => (i === list.length - 1 ? { ...item, hash } : item)))

          setHasPendingTransaction(true)
          await confirmPending()
        }

        if ((await getRequiredApprovals(batch, transferTarget.sender)).length) {
          throw new Error('Transfer approval is still missing. Please try again.')
        }

        setTransaction(null)
        setActiveBatch(toActiveBatch(batch))
        setStep('confirming')

        const hash = await transfer(batch, transferTarget.sender, transferTarget.recipient)
        pending.current = { kind: 'transfer', version: batch.version, hash, batch }

        setHasPendingTransaction(true)
        await confirmPending()
      }
      setStep('success')
    } catch (error) {
      const message = pending.current ? UNCONFIRMED_MESSAGE : getTransferError(error)
      const raw = error instanceof Error ? error.message : null
      setError(message)
      setErrorDetails(!pending.current && raw && raw !== message ? raw : null)
      if (!pending.current && succeeded.size === 0) setTarget(null)
      setStep('error')
    } finally {
      submitting.current = false
    }
  }

  const handleClose = () => {
    if (submitting.current) return
    if (step === 'success' && isSelecting) dispatch(clearBulkSelect())
    dispatch(setTransferModalDomains([]))
    onClose()
  }

  return {
    step,
    error,
    errorDetails,
    account,
    recipient,
    recipientInput,
    setRecipientInput,
    recipientError,
    isResolving,
    isBusy,
    recipientLocked: !!target,
    walletMismatch,
    canTransfer: !!address && !!recipient && !recipientError && !isResolving && !walletMismatch && domains.length > 0,
    transaction,
    completedTransactions,
    completedNames,
    remainingDomains,
    approvingContract,
    currentNetwork: activeChain.name,
    currentBatch,
    totalBatches,
    hasPendingTransaction,
    processingKind,
    approvals,
    activeBatch,
    batchTotals,
    handleTransfer,
    handleClose,
    handleRetry: () => {
      setError(null)
      setErrorDetails(null)
      setTransaction(null)
      setStep('review')
    },
  }
}
