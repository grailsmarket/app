'use client'

import { useMemo, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Address, erc20Abi, formatEther, formatUnits, Hex } from 'viem'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import {
  selectBulkRenewalModal,
  setBulkRenewalModalCanAddDomains,
  setBulkRenewalModalDomains,
} from '@/state/reducers/modals/bulkRenewalModal'
import { clearBulkSelect, selectBulkSelect, removeBulkSelectDomain } from '@/state/reducers/modals/bulkSelectModal'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import useExtendDomains from '@/hooks/registrar/useExtendDomains'
import { useRentPriceOracle } from '@/hooks/registrar/useRentPriceOracle'
import useETHPrice from '@/hooks/useETHPrice'
import { activeChain } from '@/constants/web3/chain'
import { TOKEN_ADDRESSES, TOKEN_DECIMALS, TOKENS } from '@/constants/web3/tokens'
import { normalizeName } from '@/lib/ens'
import { getSecondsPerUnit } from '@/utils/registration'
import { calculateDurationDiscount } from '@/utils/registrationPricing'
import { createRenewalBatches, getFailedRenewalIndices } from '@/utils/renewal'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { refreshEnsQueries } from '@/utils/refreshEnsQueries'
import type { TimeUnit } from '@/types/registration'
import type { RenewalBatch, RenewalEntry, RenewalStage, RenewalTransaction } from '@/types/renewal'

export const useRenewalModal = (onClose: () => void) => {
  const dispatch = useAppDispatch()
  const { domains: selectedDomains } = useAppSelector(selectBulkRenewalModal)
  const { isSelecting } = useAppSelector(selectBulkSelect)
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { address } = useAccount()
  const { extend, getRenewalQuote, publicClient } = useExtendDomains()
  const getPricing = useRentPriceOracle()
  const { ethPrice } = useETHPrice()
  const queryClient = useQueryClient()

  const [quantity, setQuantity] = useState(1)
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('years')
  const [customDate, setCustomDate] = useState(0)
  const [asset, setAsset] = useState<Address>(TOKEN_ADDRESSES.USDC)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stage, setStage] = useState<RenewalStage>('confirming')
  const [transaction, setTransaction] = useState<RenewalTransaction | null>(null)
  const [currentBatch, setCurrentBatch] = useState(1)
  const [processingBatches, setProcessingBatches] = useState(1)
  const [completedTransactions, setCompletedTransactions] = useState<RenewalTransaction[]>([])
  const [completedNames, setCompletedNames] = useState<Set<string>>(new Set())
  const [lockedEntries, setLockedEntries] = useState<RenewalEntry[] | null>(null)
  const [hasPendingTransaction, setHasPendingTransaction] = useState(false)
  const pendingBatch = useRef<{ batch: RenewalBatch; hash: Hex } | null>(null)
  const submitting = useRef(false)

  const prepared = useMemo(() => {
    if (lockedEntries) return { entries: lockedEntries, error: null }
    try {
      const entries = new Map<string, RenewalEntry>()
      for (const domain of selectedDomains) {
        const name = normalizeName(domain.name)

        if (!name.endsWith('.eth') || name.split('.').length !== 2)
          throw new Error('Only second-level .eth names can be renewed here.')
        if (domain.version !== 1 && domain.version !== 2)
          throw new Error(`The ENS version of ${name} is unknown. Refresh the name details before renewing.`)

        const currentExpiry = domain.expiry_date ? Math.floor(new Date(domain.expiry_date).getTime() / 1000) : 0
        const duration = timeUnit === 'custom' ? customDate - currentExpiry : quantity * getSecondsPerUnit(timeUnit)

        if (timeUnit === 'custom' && (!currentExpiry || !customDate))
          throw new Error('Choose a target date after every selected name’s current expiry.')
        if (!Number.isSafeInteger(duration) || duration <= 0)
          throw new Error('Select a positive renewal duration for every name.')

        entries.set(name, {
          domain,
          label: name.slice(0, -4),
          version: domain.version,
          duration: BigInt(duration),
          currentExpiry,
        })
      }

      return { entries: [...entries.values()], error: null }
    } catch (error) {
      return { entries: [], error: (error as Error).message }
    }
  }, [selectedDomains, quantity, timeUnit, customDate, lockedEntries])

  const domains = lockedEntries ? lockedEntries.map((entry) => entry.domain) : selectedDomains
  const remainingEntries = useMemo(
    () => prepared.entries.filter((entry) => !completedNames.has(entry.domain.name)),
    [prepared.entries, completedNames]
  )
  const remainingDomains = remainingEntries.map((entry) => entry.domain)
  const batches = useMemo(() => createRenewalBatches(remainingEntries), [remainingEntries])
  const v1Entries = remainingEntries.filter((entry) => entry.version === 1)
  const v2Entries = remainingEntries.filter((entry) => entry.version === 2)
  const hasV1 = domains.some((domain) => domain.version === 1)
  const hasV2 = domains.some((domain) => domain.version === 2)
  const longestExpirationDate = Math.max(
    0,
    ...domains.map((domain) => (domain.expiry_date ? new Date(domain.expiry_date).getTime() / 1000 : 0))
  )

  const quotes = useQuery({
    queryKey: [
      'renewalQuotes',
      activeChain.id,
      asset,
      remainingEntries.map((entry) => [entry.label, entry.version, entry.duration.toString()]),
    ],
    queryFn: async () => {
      const results = await Promise.all(
        batches.map(async (batch) => ({ version: batch.version, ...(await getRenewalQuote(batch, asset)) }))
      )

      return results.reduce(
        (totals, result) => ({
          v1: totals.v1 + (result.version === 1 ? result.total : BigInt(0)),
          v2: totals.v2 + (result.version === 2 ? result.total : BigInt(0)),
        }),
        { v1: BigInt(0), v2: BigInt(0) }
      )
    },
    enabled: batches.length > 0 && !prepared.error && !isLoading && !success,
    refetchInterval: isLoading || success ? false : 10000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const pricing = useQuery({
    queryKey: ['registrationPricing', activeChain.id, asset],
    queryFn: () => getPricing(asset),
    enabled: v2Entries.length > 0 && !isLoading && !success,
    refetchInterval: isLoading || success ? false : 10000,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  })

  const networkFunds = useQuery({
    queryKey: ['balance', address, activeChain.id, 'renewal'],
    queryFn: async () => {
      if (!address) throw new Error('Connect your wallet to renew names.')
      const [balance, gasPrice] = await Promise.all([publicClient.getBalance({ address }), publicClient.getGasPrice()])
      return { balance, gasPrice }
    },
    enabled: !!address && batches.length > 0 && !isLoading && !success,
    refetchInterval: isLoading || success ? false : 10000,
    retry: false,
  })

  const assetBalance = useQuery({
    queryKey: ['balance', address, activeChain.id, asset],
    queryFn: async () => {
      if (!address) throw new Error('Connect your wallet to renew names.')
      return publicClient.readContract({
        address: asset,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      })
    },
    enabled: !!address && v2Entries.length > 0 && !isLoading && !success,
    refetchInterval: isLoading || success ? false : 10000,
    retry: false,
  })

  const discount =
    pricing.data && quotes.data && !quotes.isError
      ? calculateDurationDiscount(
          v2Entries.map((entry) => entry.label),
          v2Entries.map((entry) => entry.duration),
          pricing.data
        )
      : null
  const tokenAmount = (value: bigint) => Number(formatUnits(value, TOKEN_DECIMALS[TOKENS[asset]]))
  const calculationResults =
    quotes.data && !quotes.isError && !prepared.error
      ? {
          totalPriceETH: Number(formatEther(quotes.data.v1)),
          totalPriceUSD: Number(formatEther(quotes.data.v1)) * (ethPrice || 0),
          totalPriceAsset: tokenAmount(quotes.data.v2),
          durationDiscount: discount ? { amount: tokenAmount(discount.amount), percentage: discount.percentage } : null,
        }
      : null

  const gasEstimate = BigInt(batches.length * 150000 + v1Entries.length * 50000 + v2Entries.length * 150000)
  const gasPrice = networkFunds.data?.gasPrice
  const gasCost = gasPrice === undefined ? undefined : gasEstimate * gasPrice
  const estimatedGasCost = gasCost === undefined ? null : Number(formatEther(gasCost))
  const hasSufficientEth =
    !!quotes.data &&
    !networkFunds.isError &&
    networkFunds.data !== undefined &&
    gasCost !== undefined &&
    networkFunds.data.balance >= quotes.data.v1 + gasCost
  const hasSufficientAssets =
    v2Entries.length === 0 ||
    (!assetBalance.isError && assetBalance.data !== undefined && !!quotes.data && assetBalance.data >= quotes.data.v2)
  const hasSufficientBalance = hasSufficientEth && hasSufficientAssets
  const isLoadingFunds = networkFunds.isLoading || assetBalance.isLoading
  const fundingError = networkFunds.error || assetBalance.error
  const quoteError =
    prepared.error ||
    (quotes.error ? `Could not quote renewals: ${quotes.error.message}` : null) ||
    (fundingError ? `Could not check renewal balances and fees: ${fundingError.message}` : null)

  const handleSubmit = async (event: React.MouseEvent) => {
    event.preventDefault()
    if (
      submitting.current ||
      !address ||
      (!pendingBatch.current && (!calculationResults || !hasSufficientBalance || !batches.length))
    )
      return

    submitting.current = true

    setIsLoading(true)
    setError(null)
    setLockedEntries(prepared.entries)
    setProcessingBatches(batches.length)

    const succeeded = new Set(completedNames)

    try {
      for (let index = 0; index < batches.length; index++) {
        const batch = pendingBatch.current?.batch ?? batches[index]

        setCurrentBatch(index + 1)

        let hash = pendingBatch.current?.hash

        if (!hash) {
          setTransaction(null)
          setStage('confirming')
          hash = await extend(batch, asset, (stage, hash) => {
            setStage(stage)
            setTransaction(hash ? { hash, version: batch.version } : null)
          })
          pendingBatch.current = { batch, hash }
          setHasPendingTransaction(true)
        }

        setStage('processing')
        setTransaction({ hash, version: batch.version })

        const receipt = await waitForTransaction(publicClient, hash)
        pendingBatch.current = null

        setHasPendingTransaction(false)

        if (receipt.status !== 'success') throw new Error(`Renewal transaction ${index + 1} reverted.`)

        refreshEnsQueries(queryClient, receipt)

        setCompletedTransactions((transactions) => [
          ...transactions,
          { hash: receipt.transactionHash, version: batch.version },
        ])

        const failedIndices = batch.version === 2 ? getFailedRenewalIndices(receipt) : new Set<number>()
        const renewed = batch.entries.filter((_, index) => !failedIndices.has(index))
        renewed.forEach(({ domain }) => {
          succeeded.add(domain.name)
          dispatch(removeBulkSelectDomain(domain))
        })

        setCompletedNames(new Set(succeeded))

        if (failedIndices.size) {
          const failedNames = batch.entries
            .filter((_, index) => failedIndices.has(index))
            .map(({ domain }) => domain.name)

          throw new Error(
            `Could not renew ${failedNames.join(', ')}. Successful names will not be renewed again when you retry.`
          )
        }
      }

      setSuccess(true)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Renewal failed.'
      setError(
        pendingBatch.current
          ? 'The renewal was submitted, but confirmation is unavailable. Check the transaction to continue without submitting it again.'
          : message
      )

      if (!pendingBatch.current && succeeded.size === 0) setLockedEntries(null)
    } finally {
      submitting.current = false
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (submitting.current) return

    if (success) {
      dispatch(setBulkRenewalModalCanAddDomains(false))
      if (isSelecting) dispatch(clearBulkSelect())
    }

    dispatch(setBulkRenewalModalDomains([]))
    onClose()
  }

  return {
    domains,
    poapClaimed,
    quantity,
    setQuantity,
    timeUnit,
    setTimeUnit,
    customDate,
    setCustomDate,
    asset,
    setAsset,
    showDatePicker,
    setShowDatePicker,
    success,
    isLoading,
    error,
    quoteError,
    stage,
    transaction,
    currentNetwork: activeChain.name,
    currentBatch,
    totalBatches: isLoading ? processingBatches : batches.length,
    namesProcessed: completedNames.size,
    completedTransactions,
    completedNames,
    remainingDomains,
    longestExpirationDate,
    calculationResults,
    estimatedGasCost,
    hasSufficientBalance,
    hasSufficientEth,
    hasSufficientAssets,
    hasV1,
    hasV2,
    hasDifferentV1Durations: new Set(v1Entries.map((entry) => entry.duration)).size > 1,
    hasPendingTransaction,
    isLoadingQuote: quotes.isLoading,
    isLoadingFunds,
    parametersLocked: !!lockedEntries,
    handleSubmit,
    handleClose,
    transactionUrl: ({ hash }: RenewalTransaction) => `${activeChain.blockExplorers.default.url}/tx/${hash}`,
  }
}
