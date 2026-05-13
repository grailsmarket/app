'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useBalance, useGasPrice } from 'wagmi'
import { Check } from 'ethereum-identity-kit'
import { mainnet } from 'viem/chains'
import { useQueryClient } from '@tanstack/react-query'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { selectUpgradeModal, setUpgradeModalOpen } from '@/state/reducers/modals/upgradeModal'
import useSubscriptionContract from '@/hooks/useSubscriptionContract'
import useETHPrice from '@/hooks/useETHPrice'
import { getTierDisplayName } from '@/constants/subscriptions'
import { GrailsSubscriptionAbi } from '@/constants/abi/GrailsSubscriptionAbi'
import { GRAILS_SUBSCRIPTION_ADDRESS } from '@/constants/web3/contracts'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { MODAL_TIERS } from './tierMetadata'
import PlanStep from './components/PlanStep'
import DurationStep, { DAYS_PER_UNIT, MIN_DURATION_DAYS, type DurationUnit } from './components/DurationStep'
import ReviewStep from './components/ReviewStep'

interface UpgradeModalProps {
  onClose: () => void
}

type WizardStep = 'plan' | 'duration' | 'review'
type TxStep = 'confirming' | 'processing' | 'success' | 'error'
type Step = WizardStep | TxStep

const WIZARD_STEPS: WizardStep[] = ['plan', 'duration', 'review']
const GAS_FALLBACK = BigInt(150_000)
const GAS_BUFFER_PCT = BigInt(120) // 20% safety buffer
const PRICE_DEBOUNCE_MS = 300

const priceKey = (tierId: number, days: number) => `${tierId}-${days}`

const getMinCountForUnit = (unit: DurationUnit): number => Math.ceil(MIN_DURATION_DAYS / DAYS_PER_UNIT[unit])

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
  const dispatch = useAppDispatch()
  const { address } = useAccount()
  const { subscription } = useAppSelector(selectUserProfile)
  const { preselectedTierId } = useAppSelector(selectUpgradeModal)
  const { getPrice, subscribe, upgrade, publicClient } = useSubscriptionContract()
  const { ethPrice } = useETHPrice()
  const queryClient = useQueryClient()

  const { data: ethBalance } = useBalance({ address, chainId: mainnet.id })
  const { data: liveGasPrice } = useGasPrice({ chainId: mainnet.id })

  // ---------- Tier resolution ----------
  const currentTierId = subscription?.tierId ?? 0
  const hasActiveSub =
    currentTierId > 0 && !!subscription?.tierExpiresAt && new Date(subscription.tierExpiresAt) > new Date()

  // All tiers in the modal are visible. Lower tiers (already included in user's
  // current plan) are shown as locked. Selectable = current or higher.
  const selectableTierIds = useMemo(
    () => MODAL_TIERS.filter((id) => id >= currentTierId),
    [currentTierId]
  )

  const initialTierId = useMemo(() => {
    if (preselectedTierId !== null && selectableTierIds.includes(preselectedTierId)) return preselectedTierId
    if (hasActiveSub && selectableTierIds.includes(currentTierId)) return currentTierId
    return selectableTierIds[0] ?? MODAL_TIERS[0]
  }, [preselectedTierId, selectableTierIds, hasActiveSub, currentTierId])

  const [selectedTierId, setSelectedTierId] = useState<number>(initialTierId)

  const isExtending = hasActiveSub && selectedTierId === currentTierId
  const isUpgrading = hasActiveSub && selectedTierId > currentTierId

  // ---------- Duration state ----------
  const [unit, setUnit] = useState<DurationUnit>('days')
  const [count, setCount] = useState<number>(MIN_DURATION_DAYS)
  const durationDays = useMemo(() => count * DAYS_PER_UNIT[unit], [count, unit])
  const isDurationValid = durationDays >= MIN_DURATION_DAYS

  const handleUnitChange = useCallback(
    (newUnit: DurationUnit) => {
      if (newUnit === unit) return
      const currentDays = count * DAYS_PER_UNIT[unit]
      const minCount = getMinCountForUnit(newUnit)
      const nextCount = Math.max(minCount, Math.round(currentDays / DAYS_PER_UNIT[newUnit]))
      setUnit(newUnit)
      setCount(nextCount)
    },
    [unit, count]
  )

  const handleDateSelect = useCallback((timestampSeconds: number) => {
    const nowMs = Date.now()
    const targetMs = timestampSeconds * 1000
    const days = Math.max(MIN_DURATION_DAYS, Math.ceil((targetMs - nowMs) / 86_400_000))
    setUnit('days')
    setCount(days)
  }, [])

  // ---------- Wizard step state ----------
  const [step, setStep] = useState<Step>('plan')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const isWizardStep = step === 'plan' || step === 'duration' || step === 'review'
  const wizardIndex = isWizardStep ? WIZARD_STEPS.indexOf(step) : -1

  // ---------- Price cache & fetching ----------
  const [priceCache, setPriceCache] = useState<Record<string, bigint>>({})
  const prefetchedRef = useRef(false)

  // Prefetch monthly + yearly prices for the selectable plans
  useEffect(() => {
    if (prefetchedRef.current) return
    prefetchedRef.current = true

    const durationsToPrice = [30, 365]

    void Promise.all(
      selectableTierIds.flatMap((tierId) =>
        durationsToPrice.map(async (days) => {
          try {
            const wei = await getPrice(tierId, days)
            setPriceCache((prev) => ({ ...prev, [priceKey(tierId, days)]: wei }))
          } catch {
            // skip
          }
        })
      )
    )
  }, [selectableTierIds, getPrice])

  // Fetch price for the selected (tier, durationDays) with debounce
  useEffect(() => {
    if (!selectedTierId || durationDays <= 0) return
    const key = priceKey(selectedTierId, durationDays)
    if (priceCache[key] !== undefined) return

    let cancelled = false
    const handle = window.setTimeout(async () => {
      try {
        const wei = await getPrice(selectedTierId, durationDays)
        if (!cancelled) setPriceCache((prev) => ({ ...prev, [key]: wei }))
      } catch {
        // ignore — UI will continue to show "—" until valid
      }
    }, PRICE_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [selectedTierId, durationDays, priceCache, getPrice])

  const price = priceCache[priceKey(selectedTierId, durationDays)] ?? null
  const isPriceLoading = price === null && isDurationValid

  // ---------- Gas estimation (review step) ----------
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null)

  useEffect(() => {
    if (step !== 'review' || !publicClient || !address || price === null) return

    let cancelled = false
    const estimate = async () => {
      try {
        const functionName = isUpgrading ? 'upgrade' : 'subscribe'
        const args = [BigInt(selectedTierId), BigInt(durationDays)] as const
        const raw = await publicClient.estimateContractGas({
          address: GRAILS_SUBSCRIPTION_ADDRESS,
          abi: GrailsSubscriptionAbi,
          functionName,
          args,
          value: price,
          account: address,
        })
        if (!cancelled) setGasEstimate((raw * GAS_BUFFER_PCT) / BigInt(100))
      } catch (err) {
        console.warn('Gas estimation failed, using fallback:', err)
        if (!cancelled) setGasEstimate(GAS_FALLBACK)
      }
    }

    void estimate()
    return () => {
      cancelled = true
    }
  }, [step, publicClient, address, price, selectedTierId, durationDays, isUpgrading])

  // ---------- Balance check ----------
  const hasSufficientBalance = useMemo(() => {
    if (!ethBalance || price === null) return false
    const gasCost = gasEstimate && liveGasPrice ? gasEstimate * liveGasPrice : BigInt(0)
    return ethBalance.value >= price + gasCost
  }, [ethBalance, price, gasEstimate, liveGasPrice])

  // ---------- Submission ----------
  const handleSubmit = async () => {
    if (price === null) return
    setError(null)
    setStep('confirming')

    try {
      const tx = isUpgrading
        ? await upgrade(selectedTierId, durationDays, price)
        : await subscribe(selectedTierId, durationDays, price)

      if (!tx) {
        setError('Transaction was rejected')
        setStep('error')
        return
      }

      setTxHash(tx)
      setStep('processing')

      const receipt = await publicClient?.waitForTransactionReceipt({
        hash: tx as `0x${string}`,
        confirmations: 1,
      })

      if (receipt?.status !== 'success') {
        setError('Transaction failed')
        setStep('error')
        return
      }

      setStep('success')
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['auth', 'status'] })
      }, 2500)
    } catch (err: unknown) {
      console.error('Subscription transaction failed:', err)
      setError(err instanceof Error ? err.message : 'Transaction failed')
      setStep('error')
    }
  }

  // ---------- Close ----------
  const handleClose = () => {
    if (step === 'confirming' || step === 'processing') return
    dispatch(setUpgradeModalOpen(false))
    onClose()
  }

  // ---------- Navigation helpers ----------
  const goNext = () => {
    if (step === 'plan') setStep('duration')
    else if (step === 'duration') setStep('review')
    else if (step === 'review') void handleSubmit()
  }

  const goBack = () => {
    if (step === 'duration') setStep('plan')
    else if (step === 'review') setStep('duration')
  }

  const canGoBack = step === 'duration' || step === 'review'

  // ---------- Header & button labels ----------
  const headerText = isExtending ? 'Extend Subscription' : isUpgrading ? 'Upgrade Subscription' : 'Subscribe'

  const confirmLabel = (() => {
    if (!hasSufficientBalance && price !== null) return 'Insufficient ETH Balance'
    if (isExtending) return `Extend ${getTierDisplayName(selectedTierId)}`
    if (isUpgrading) return `Upgrade to ${getTierDisplayName(selectedTierId)}`
    return `Subscribe to ${getTierDisplayName(selectedTierId)}`
  })()

  const nextLabel = step === 'review' ? confirmLabel : 'Next'

  const nextDisabled = (() => {
    if (step === 'plan') return !selectableTierIds.includes(selectedTierId)
    if (step === 'duration') return !isDurationValid || isPriceLoading
    if (step === 'review') return price === null || !hasSufficientBalance
    return false
  })()

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        handleClose()
      }}
      className='fixed inset-0 z-[100] flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4 starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='border-tertiary bg-background p-lg sm:p-xl relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-3 overflow-y-auto border-t sm:gap-4 md:max-w-md md:rounded-md md:border-2'
      >
        {/* Header */}
        <div className='flex flex-col items-center gap-1 pb-1'>
          <h2 className='font-sedan-sc text-center text-3xl'>{headerText}</h2>
          {isWizardStep && (
            <p className='text-neutral text-sm'>
              Step {wizardIndex + 1} of {WIZARD_STEPS.length}
            </p>
          )}
        </div>

        {/* Body */}
        {step === 'plan' && (
          <PlanStep
            currentTierId={currentTierId}
            hasActiveSub={hasActiveSub}
            selectedTierId={selectedTierId}
            onSelectTier={setSelectedTierId}
            priceCache={priceCache}
            ethPrice={ethPrice}
          />
        )}

        {step === 'duration' && (
          <DurationStep
            selectedTierId={selectedTierId}
            unit={unit}
            count={count}
            durationDays={durationDays}
            onUnitChange={handleUnitChange}
            onCountChange={setCount}
            onDateSelect={handleDateSelect}
            price={price}
            isPriceLoading={isPriceLoading}
            ethPrice={ethPrice}
          />
        )}

        {step === 'review' && (
          <ReviewStep
            selectedTierId={selectedTierId}
            durationDays={durationDays}
            price={price}
            gasEstimate={gasEstimate}
            gasPrice={liveGasPrice ?? null}
            hasSufficientBalance={hasSufficientBalance}
            ethPrice={ethPrice}
          />
        )}

        {(step === 'confirming' || step === 'processing') && (
          <div className='flex w-full flex-col items-center gap-4 py-4 text-center'>
            <h3 className='text-xl font-bold'>
              {step === 'confirming' ? 'Confirm in Wallet' : 'Processing Transaction'}
            </h3>
            <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2' />
            <p className='text-neutral text-lg'>
              {step === 'confirming'
                ? 'Please confirm the transaction in your wallet...'
                : 'Waiting for confirmation...'}
            </p>
            {txHash && (
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target='_blank'
                rel='noopener noreferrer'
                className='text-primary hover:text-primary/80 text-lg underline transition-colors'
              >
                View on Etherscan
              </a>
            )}
          </div>
        )}

        {step === 'success' && (
          <div className='flex flex-col items-center gap-4 py-2'>
            <div className='bg-primary mx-auto flex w-fit items-center justify-center rounded-full p-3'>
              <Check className='text-background h-8 w-8' />
            </div>
            <div className='flex flex-col items-center gap-2 text-center'>
              <h3 className='mb-2 text-xl font-bold'>
                {isExtending
                  ? 'Subscription Extended!'
                  : isUpgrading
                    ? 'Subscription Upgraded!'
                    : 'Subscription Active!'}
              </h3>
              <p className='text-neutral text-md'>You now have {getTierDisplayName(selectedTierId)} access.</p>
              {txHash && (
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              )}
            </div>
          </div>
        )}

        {step === 'error' && error && (
          <div className='rounded-lg border border-red-500/30 bg-red-900/20 p-3'>
            <p className='text-sm text-red-400'>{error}</p>
          </div>
        )}

        {/* Footer */}
        <div className='flex w-full flex-col gap-2'>
          {isWizardStep && (
            <div className='flex w-full gap-2'>
              {canGoBack && (
                <SecondaryButton onClick={goBack} className='flex-1'>
                  Back
                </SecondaryButton>
              )}
              <PrimaryButton
                onClick={goNext}
                disabled={nextDisabled}
                className={canGoBack ? 'flex-1' : 'w-full'}
              >
                {nextLabel}
              </PrimaryButton>
            </div>
          )}

          {step === 'success' && (
            <PrimaryButton onClick={handleClose} className='w-full'>
              Done
            </PrimaryButton>
          )}

          {step === 'error' && (
            <PrimaryButton onClick={() => setStep('review')} className='w-full'>
              Try Again
            </PrimaryButton>
          )}

          {step !== 'success' && step !== 'confirming' && step !== 'processing' && (
            <SecondaryButton onClick={handleClose} className='w-full'>
              Close
            </SecondaryButton>
          )}
        </div>
      </div>
    </div>
  )
}

export default UpgradeModal
