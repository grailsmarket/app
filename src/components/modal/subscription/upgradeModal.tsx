'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAccount, useBalance } from 'wagmi'
import { Check } from 'ethereum-identity-kit'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { setUpgradeModalOpen } from '@/state/reducers/modals/upgradeModal'
import useSubscriptionContract from '@/hooks/useSubscriptionContract'
import useETHPrice from '@/hooks/useETHPrice'
import { SUBSCRIBABLE_TIERS, getTierDisplayName, TIER_MAP } from '@/constants/subscriptions'
import { TOKEN_DECIMALS } from '@/constants/web3/tokens'
import PrimaryButton from '@/components/ui/buttons/primary'
import SecondaryButton from '@/components/ui/buttons/secondary'
import { useQueryClient } from '@tanstack/react-query'
import { mainnet } from 'viem/chains'
import { cn } from '@/utils/tailwind'

interface UpgradeModalProps {
  onClose: () => void
}

type Step = 'review' | 'confirming' | 'processing' | 'success' | 'error'

const DURATION_PRESETS = [
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
  { label: '365 days', value: 365 },
]

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose }) => {
  const dispatch = useAppDispatch()
  const { address } = useAccount()
  const { subscription } = useAppSelector(selectUserProfile)
  const { getPrice, previewUpgrade, subscribe, upgrade, publicClient } = useSubscriptionContract()
  const { ethPrice } = useETHPrice()
  const queryClient = useQueryClient()

  const currentTierId = subscription?.tierId ?? 0
  const isUpgrade = currentTierId > 0 && subscription?.tierExpiresAt && new Date(subscription.tierExpiresAt) > new Date()

  // Available tiers (higher than current)
  const availableTiers = useMemo(
    () => SUBSCRIBABLE_TIERS.filter((id) => id > currentTierId),
    [currentTierId]
  )

  const [selectedTierId, setSelectedTierId] = useState<number>(availableTiers[0] ?? 1)
  const [durationDays, setDurationDays] = useState<number>(30)
  const [step, setStep] = useState<Step>('review')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Price cache: key = "tierId-days", value = bigint wei
  const [priceCache, setPriceCache] = useState<Record<string, bigint>>({})
  const [pricesLoaded, setPricesLoaded] = useState(false)
  const fetchedRef = useRef(false)

  // Upgrade preview cache: key = tierId
  const [upgradePreviewCache, setUpgradePreviewCache] = useState<
    Record<number, { newExpiry: bigint; convertedSeconds: bigint }>
  >({})

  const { data: ethBalance } = useBalance({
    address,
    chainId: mainnet.id,
  })

  const priceCacheKey = (tierId: number, days: number) => `${tierId}-${days}`

  // Pre-fetch all prices on mount (every tier x preset duration)
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const fetchAllPrices = async () => {
      const allDurations = [...DURATION_PRESETS.map((p) => p.value)]
      const results: Record<string, bigint> = {}

      await Promise.all(
        availableTiers.flatMap((tierId) =>
          allDurations.map(async (days) => {
            try {
              const p = await getPrice(tierId, days)
              results[priceCacheKey(tierId, days)] = p
            } catch {
              // skip failed lookups
            }
          })
        )
      )

      setPriceCache(results)
      setPricesLoaded(true)
    }

    fetchAllPrices()
  }, [])

  // Fetch price for custom duration (not in presets) on demand
  const fetchCustomPrice = useCallback(
    async (tierId: number, days: number) => {
      const key = priceCacheKey(tierId, days)
      if (priceCache[key] !== undefined) return
      try {
        const p = await getPrice(tierId, days)
        setPriceCache((prev) => ({ ...prev, [key]: p }))
      } catch {
        // ignore
      }
    },
    [priceCache, getPrice]
  )

  // When duration changes to a non-preset value, fetch it
  useEffect(() => {
    if (!selectedTierId || !durationDays || durationDays <= 0) return
    const key = priceCacheKey(selectedTierId, durationDays)
    if (priceCache[key] === undefined && pricesLoaded) {
      fetchCustomPrice(selectedTierId, durationDays)
    }
  }, [selectedTierId, durationDays, pricesLoaded, priceCache, fetchCustomPrice])

  // Fetch upgrade previews for all available tiers
  useEffect(() => {
    if (!isUpgrade || !address) return

    const fetchPreviews = async () => {
      const results: Record<number, { newExpiry: bigint; convertedSeconds: bigint }> = {}
      await Promise.all(
        availableTiers.map(async (tierId) => {
          try {
            results[tierId] = await previewUpgrade(address, tierId)
          } catch {
            // skip
          }
        })
      )
      setUpgradePreviewCache(results)
    }

    fetchPreviews()
  }, [isUpgrade, address])

  // Derive current price from cache
  const price = priceCache[priceCacheKey(selectedTierId, durationDays)] ?? null
  const upgradePreview = upgradePreviewCache[selectedTierId] ?? null

  const priceETH = useMemo(() => {
    if (price === null) return null
    return Number(price) / 10 ** TOKEN_DECIMALS.ETH
  }, [price])

  const priceUSD = useMemo(() => {
    if (priceETH === null) return null
    return priceETH * ethPrice
  }, [priceETH, ethPrice])

  const hasSufficientBalance = useMemo(() => {
    if (!ethBalance || price === null) return false
    return ethBalance.value >= price
  }, [ethBalance, price])

  const handleSubmit = async () => {
    if (price === null) return
    setError(null)
    setStep('confirming')

    try {
      let tx: string | null

      if (isUpgrade) {
        tx = await upgrade(selectedTierId, durationDays, price)
      } else {
        tx = await subscribe(selectedTierId, durationDays, price)
      }

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

      // Refetch auth to pick up new subscription data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['auth', 'status'] })
      }, 2500)
    } catch (err: any) {
      console.error('Subscription transaction failed:', err)
      setError(err?.message || 'Transaction failed')
      setStep('error')
    }
  }

  const handleClose = () => {
    if (step === 'confirming' || step === 'processing') return
    dispatch(setUpgradeModalOpen(false))
    onClose()
  }

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        if (step === 'confirming' || step === 'processing') return
        handleClose()
      }}
      className='fixed inset-0 z-[100] flex h-[100dvh] w-screen items-end justify-end bg-black/40 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4 starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='border-tertiary bg-background p-lg sm:p-xl relative mx-auto flex max-h-[calc(100dvh-80px)] w-full flex-col gap-2 overflow-y-auto border-t sm:gap-4 md:max-w-md md:rounded-md md:border-2'
      >
        {/* Header */}
        <div className='flex min-h-6 items-center justify-center pb-2'>
          <h2 className='font-sedan-sc text-center text-3xl'>
            {isUpgrade ? 'Upgrade Subscription' : 'Subscribe'}
          </h2>
        </div>

        {step === 'success' ? (
          <div className='flex flex-col items-center gap-4 py-2'>
            <div className='bg-primary mx-auto flex w-fit items-center justify-center rounded-full p-3'>
              <Check className='text-background h-8 w-8' />
            </div>
            <div className='flex flex-col items-center gap-2 text-center'>
              <h3 className='mb-2 text-xl font-bold'>
                {isUpgrade ? 'Subscription Upgraded!' : 'Subscription Active!'}
              </h3>
              <p className='text-neutral text-md'>
                You now have {getTierDisplayName(selectedTierId)} access.
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
          </div>
        ) : step === 'confirming' || step === 'processing' ? (
          <div className='flex w-full flex-col gap-4'>
            <h2 className='mt-4 text-center text-xl font-bold'>
              {step === 'confirming' ? 'Confirm in Wallet' : 'Processing Transaction'}
            </h2>
            <div className='flex flex-col items-center justify-center gap-4 pt-4 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
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
          </div>
        ) : (
          <div className='flex w-full flex-col gap-2 sm:gap-3'>
            {/* Tier Selector */}
            <div className='flex flex-col gap-2'>
              <p className='text-md text-neutral font-medium'>Select Plan</p>
              <div className='flex flex-row gap-2'>
                {availableTiers.map((tierId) => {
                  const tierPrice = priceCache[priceCacheKey(tierId, durationDays)]
                  const tierPriceETH = tierPrice !== undefined ? Number(tierPrice) / 10 ** TOKEN_DECIMALS.ETH : null
                  const tierPriceUSD = tierPriceETH !== null ? tierPriceETH * ethPrice : null
                  return (
                    <button
                      key={tierId}
                      onClick={() => setSelectedTierId(tierId)}
                      className={cn(
                        'border-tertiary flex-1 rounded-md border p-3 text-center transition-colors',
                        selectedTierId === tierId
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-secondary'
                      )}
                    >
                      <p className='text-md font-semibold'>{TIER_MAP[tierId]?.name}</p>
                      {tierPriceETH !== null ? (
                        <>
                          <p className='text-neutral text-sm'>{tierPriceETH.toFixed(4)} ETH</p>
                          <p className='text-neutral text-xs'>(${tierPriceUSD!.toFixed(2)})</p>
                        </>
                      ) : (
                        <p className='text-neutral text-sm'>{TIER_MAP[tierId]?.label}</p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Duration Input */}
            <div className='flex flex-col gap-2'>
              <p className='text-md text-neutral font-medium'>Duration</p>
              <div className='flex flex-row gap-2'>
                {DURATION_PRESETS.map((preset) => {
                  const presetPrice = priceCache[priceCacheKey(selectedTierId, preset.value)]
                  const presetPriceETH = presetPrice !== undefined ? Number(presetPrice) / 10 ** TOKEN_DECIMALS.ETH : null
                  const presetPriceUSD = presetPriceETH !== null ? presetPriceETH * ethPrice : null
                  return (
                    <button
                      key={preset.value}
                      onClick={() => setDurationDays(preset.value)}
                      className={cn(
                        'border-tertiary flex-1 rounded-md border px-3 py-2 text-center transition-colors',
                        durationDays === preset.value
                          ? 'border-primary bg-primary/10'
                          : 'hover:bg-secondary'
                      )}
                    >
                      <p className='text-sm font-medium'>{preset.label}</p>
                      {presetPriceETH !== null && (
                        <>
                          <p className='text-neutral text-xs'>{presetPriceETH.toFixed(4)} ETH</p>
                          <p className='text-neutral text-xs'>(${presetPriceUSD!.toFixed(2)})</p>
                        </>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='number'
                  min={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value)))}
                  className='border-tertiary bg-secondary text-md w-full rounded-md border px-3 py-2'
                  placeholder='Custom days'
                />
                <span className='text-neutral text-sm whitespace-nowrap'>days</span>
              </div>
            </div>

            {/* Price Display */}
            <div className={cn(
              'bg-secondary border-tertiary rounded-lg border p-3 transition-opacity',
              price === null ? 'opacity-50' : 'opacity-100'
            )}>
              <div className='text-md flex items-center justify-between'>
                <p>Total Cost:</p>
                <div className='flex flex-col items-end'>
                  <p className='font-medium'>
                    {priceETH !== null ? `${priceETH.toFixed(6)} ETH` : '--'}
                  </p>
                  {priceUSD !== null && (
                    <p className='text-neutral text-xs'>(${priceUSD.toFixed(2)})</p>
                  )}
                </div>
              </div>
            </div>

            {/* Upgrade Preview */}
            {isUpgrade && upgradePreview && (
              <div className='bg-secondary border-tertiary rounded-lg border p-3'>
                <p className='text-md mb-1 font-medium'>Upgrade Preview</p>
                <div className='text-md space-y-1'>
                  <div className='flex justify-between'>
                    <span className='text-neutral'>New expiry:</span>
                    <span className='font-medium text-green-500'>
                      {new Date(Number(upgradePreview.newExpiry) * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-neutral'>Converted time:</span>
                    <span className='font-medium'>
                      {Math.floor(Number(upgradePreview.convertedSeconds) / 86400)} days
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
                <p className='text-sm text-red-400'>{error}</p>
              </div>
            )}

            {/* Insufficient balance warning */}
            {price !== null && !hasSufficientBalance && (
              <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
                <p className='text-md text-red-400'>
                  Insufficient ETH balance.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className='flex flex-col gap-2'>
          {step === 'review' && (
            <PrimaryButton
              onClick={handleSubmit}
              disabled={price === null || !hasSufficientBalance}
              className='w-full'
            >
              {!hasSufficientBalance && price !== null
                ? 'Insufficient ETH Balance'
                : isUpgrade
                  ? `Upgrade to ${getTierDisplayName(selectedTierId)}`
                  : `Subscribe to ${getTierDisplayName(selectedTierId)}`}
            </PrimaryButton>
          )}
          {step === 'error' && (
            <PrimaryButton onClick={() => setStep('review')} className='w-full'>
              Try Again
            </PrimaryButton>
          )}
          <SecondaryButton
            onClick={handleClose}
            className='w-full'
            disabled={step === 'confirming' || step === 'processing'}
          >
            Close
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}

export default UpgradeModal
