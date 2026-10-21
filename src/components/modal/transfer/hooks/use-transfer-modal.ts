'use client'

import { useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Address, isAddress, zeroAddress } from 'viem'
import { fetchAccount } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { setTransferModalDomains, TransferDomainType } from '@/state/reducers/modals/transferModal'
import { clearBulkSelect, removeBulkSelectDomain, selectBulkSelect } from '@/state/reducers/modals/bulkSelectModal'
import useTransferDomains from '@/hooks/registrar/useTransferDomains'
import { useDebounce } from '@/hooks/useDebounce'
import { accountQueryKey } from '@/utils/queryKeys'
import { getTransferChain, getTransferDomainKey, getTransferError } from '@/utils/transfer'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { ENS_V1_MAINNET_CONTRACTS } from '@/constants/web3/ens'
import type { TransferBatch, TransferStep, TransferTransaction } from '@/types/transfer'

type PendingTransaction = TransferTransaction & ({ kind: 'approval' } | { kind: 'transfer'; batch: TransferBatch })

export const useTransferModal = (domains: TransferDomainType[], onClose: () => void) => {
  const dispatch = useAppDispatch()
  const { address } = useAccount()
  const { isSelecting, domains: selectedDomains } = useAppSelector(selectBulkSelect)
  const queryClient = useQueryClient()
  const { prepareBatches, getRequiredApprovals, approve, simulate, transfer, getPublicClient } = useTransferDomains()
  const [step, setStep] = useState<TransferStep>('review')
  const [error, setError] = useState<string | null>(null)
  const [recipientInput, setRecipientInput] = useState('')
  const input = recipientInput.trim()
  const debouncedInput = useDebounce(input, 200)
  const [target, setTarget] = useState<{ sender: Address; recipient: Address } | null>(null)
  const [transaction, setTransaction] = useState<TransferTransaction | null>(null)
  const [completedTransactions, setCompletedTransactions] = useState<TransferTransaction[]>([])
  const [completedNames, setCompletedNames] = useState<Set<string>>(new Set())
  const [approvingContract, setApprovingContract] = useState('')
  const [currentVersion, setCurrentVersion] = useState<1 | 2>(1)
  const [currentBatch, setCurrentBatch] = useState(1)
  const [totalBatches, setTotalBatches] = useState(1)
  const [hasPendingTransaction, setHasPendingTransaction] = useState(false)
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

    const succeeded = new Set(completedNames)

    const confirmPending = async () => {
      const current = pending.current
      if (!current) return

      setCurrentVersion(current.version)
      setTransaction(current)
      setStep('processing')

      const receipt = await waitForTransaction(getPublicClient(current.version), current.hash)
      pending.current = null

      setHasPendingTransaction(false)

      if (receipt.status !== 'success') {
        throw new Error(current.kind === 'approval' ? 'Transfer approval reverted.' : 'Transfer transaction reverted.')
      }

      if (current.kind === 'transfer') {
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
        setTimeout(() => {
          current.batch.entries.forEach(({ domain }) =>
            queryClient.invalidateQueries({ queryKey: ['name', 'details', domain.name] })
          )
          queryClient.invalidateQueries({ queryKey: ['profile', 'domains'] })
        }, 2000)
      }
    }

    try {
      await confirmPending()
      const remaining = domains.filter((domain) => !succeeded.has(getTransferDomainKey(domain)))
      const batches = await prepareBatches(remaining, transferTarget.sender)
      setTotalBatches(batches.length)

      await Promise.all(batches.map((batch) => simulate(batch, transferTarget.sender, transferTarget.recipient)))

      for (let index = 0; index < batches.length; index++) {
        const batch = batches[index]

        setCurrentBatch(index + 1)
        setCurrentVersion(batch.version)

        const approvals = await getRequiredApprovals(batch, transferTarget.sender)

        for (const contract of approvals) {
          setApprovingContract(contract === ENS_V1_MAINNET_CONTRACTS.nameWrapper ? 'Name Wrapper' : 'ENS Registrar')
          setTransaction(null)
          setStep('approving')

          const hash = await approve(contract, transferTarget.sender)
          pending.current = { kind: 'approval', version: 1, hash }

          setHasPendingTransaction(true)
          await confirmPending()
        }

        if ((await getRequiredApprovals(batch, transferTarget.sender)).length) {
          throw new Error('Transfer approval is still missing. Please try again.')
        }

        setTransaction(null)
        setStep('confirming')

        const hash = await transfer(batch, transferTarget.sender, transferTarget.recipient)
        pending.current = { kind: 'transfer', version: batch.version, hash, batch }

        setHasPendingTransaction(true)
        await confirmPending()
      }
      setStep('success')
    } catch (error) {
      setError(
        pending.current
          ? 'The transaction was submitted, but confirmation is unavailable. Check the transaction to continue without submitting it again.'
          : getTransferError(error)
      )
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
    currentNetwork: getTransferChain(currentVersion).name,
    currentBatch,
    totalBatches,
    hasPendingTransaction,
    handleTransfer,
    handleClose,
    handleRetry: () => {
      setError(null)
      setTransaction(null)
      setStep('review')
    },
  }
}
