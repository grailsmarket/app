'use client'

import { useState, useEffect, useMemo } from 'react'
import { SeaportOrderBuilder } from '@/lib/seaport/orderBuilder'
import { useAccount, usePublicClient, useWalletClient, useBalance, useGasPrice } from 'wagmi'
import {
  SEAPORT_ADDRESS,
  MARKETPLACE_CONDUIT_ADDRESS,
  MARKETPLACE_CONDUIT_KEY,
  OPENSEA_CONDUIT_ADDRESS,
  OPENSEA_CONDUIT_KEY,
} from '@/constants/web3/contracts'
import { USDC_ADDRESS, ETH_ADDRESS, TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { SEAPORT_ABI } from '@/lib/seaport/abi'
import Price from '@/components/ui/price'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { Check } from 'ethereum-identity-kit'
import { useQueryClient } from '@tanstack/react-query'
import useModifyCart from '@/hooks/useModifyCart'
import { useSeaportContext } from '@/context/seaport'
import { mainnet } from 'viem/chains'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import ClaimPoap from '../poap/claimPoap'

interface BuyNowModalProps {
  listing: DomainListingType | null
  domain: MarketplaceDomainType | null
  onClose: () => void
}

type TransactionStep = 'review' | 'approving' | 'confirming' | 'processing' | 'success' | 'error'

// ERC20 ABI for approve and allowance functions
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * Determine the correct approval target based on the order's conduitKey
 */
function getApprovalTarget(conduitKey: string | undefined): string {
  if (!conduitKey || conduitKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    // No conduit key or zero hash means approve Seaport directly
    return SEAPORT_ADDRESS
  }

  // Match against known conduit keys
  if (conduitKey.toLowerCase() === OPENSEA_CONDUIT_KEY.toLowerCase()) {
    return OPENSEA_CONDUIT_ADDRESS
  }

  if (conduitKey.toLowerCase() === MARKETPLACE_CONDUIT_KEY.toLowerCase()) {
    return MARKETPLACE_CONDUIT_ADDRESS
  }

  // Default to Seaport if unknown conduit key
  console.warn('Unknown conduit key:', conduitKey, '- defaulting to Seaport')
  return SEAPORT_ADDRESS
}

const BuyNowModal: React.FC<BuyNowModalProps> = ({ listing, domain, onClose }) => {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const { modifyCart } = useModifyCart()
  const publicClient = usePublicClient()
  const { data: gasPrice } = useGasPrice()
  const { data: walletClient } = useWalletClient()
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { isCorrectChain, checkChain, getCurrentChain } = useSeaportContext()

  const [step, setStep] = useState<TransactionStep>('review')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null)

  const orderBuilder = new SeaportOrderBuilder()

  // Get balances
  const { data: ethBalance } = useBalance({
    address,
  })

  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS as `0x${string}`,
  })

  // Check if listing uses ETH or USDC
  const isETHListing = useMemo(() => {
    return !listing?.currency_address || listing.currency_address.toLowerCase() === ETH_ADDRESS.toLowerCase()
  }, [listing])

  const isUSDCListing = useMemo(() => {
    return listing?.currency_address?.toLowerCase() === USDC_ADDRESS.toLowerCase()
  }, [listing])

  // Check if user has sufficient balance
  const hasSufficientBalance = useMemo(() => {
    if (!listing) return false

    if (isETHListing) {
      if (!ethBalance || !gasEstimate || !gasPrice) return false
      // For ETH, include gas costs in the calculation
      const totalCost = BigInt(listing.price) + gasEstimate * gasPrice
      return ethBalance.value >= totalCost
    } else if (isUSDCListing) {
      if (!usdcBalance) return false
      return usdcBalance.value >= BigInt(listing.price)
    }

    return false
  }, [listing, isETHListing, isUSDCListing, ethBalance, usdcBalance, gasEstimate, gasPrice])

  useEffect(() => {
    // Estimate gas and check approval when modal opens
    estimateGas()
    checkApproval()
    getCurrentChain()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formattedGasEstimate = useMemo(() => {
    if (!gasPrice || !gasEstimate) return null
    return Number((gasEstimate * gasPrice) / BigInt(10 ** 12)) / 10 ** 6
  }, [gasPrice, gasEstimate])

  if (!listing || !domain) return null

  const estimateGas = async () => {
    try {
      if (!address || !walletClient || !publicClient) return

      const order = orderBuilder.parseStoredOrder(listing)
      if (!order) {
        setError('Invalid order data')
        return
      }

      // Calculate total payment
      const totalPayment = orderBuilder.calculateTotalPayment(order)
      const usesETH = orderBuilder.usesNativeToken(order)
      const isERC20Order = !usesETH

      let estimatedGas: bigint

      try {
        if (isERC20Order) {
          // For ERC20 orders, estimate gas for fulfillAdvancedOrder
          const fulfillerConduitKey =
            order.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000'
          const advancedOrder = orderBuilder.buildAdvancedOrder(order)

          estimatedGas = await publicClient.estimateContractGas({
            address: SEAPORT_ADDRESS as `0x${string}`,
            abi: SEAPORT_ABI,
            functionName: 'fulfillAdvancedOrder',
            args: [
              // @ts-expect-error AdvancedOrder is of the correct type
              advancedOrder,
              [], // criteriaResolvers
              fulfillerConduitKey,
              address, // recipient
            ],
            value: usesETH ? totalPayment : BigInt(0),
            account: address,
          })
        } else {
          // For ETH orders, estimate gas for fulfillBasicOrder_efficient_6GL6yc
          const basicOrderParams = orderBuilder.buildBasicOrderParameters(order)

          estimatedGas = await publicClient.estimateContractGas({
            address: SEAPORT_ADDRESS as `0x${string}`,
            abi: SEAPORT_ABI,
            functionName: 'fulfillBasicOrder_efficient_6GL6yc',
            args: [basicOrderParams],
            value: totalPayment,
            account: address,
          })
        }

        // Add 20% buffer to the estimated gas to ensure transaction success
        const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100)
        setGasEstimate(gasWithBuffer)
      } catch (estimateError) {
        console.warn('Failed to estimate gas, using fallback:', estimateError)
        // Fallback to reasonable defaults if estimation fails
        setGasEstimate(isERC20Order ? BigInt(400000) : BigInt(250000))
      }
    } catch (err) {
      console.error('Failed to estimate gas:', err)
      // Set a reasonable fallback
      setGasEstimate(BigInt(300000))
    }
  }

  const checkApproval = async () => {
    try {
      if (!address || !publicClient) return

      // Check if this listing uses USDC
      const isUSDC = listing.currency_address?.toLowerCase() === USDC_ADDRESS.toLowerCase()
      if (!isUSDC) {
        setNeedsApproval(false)
        return
      }

      // Parse the order to get the conduitKey
      const order = orderBuilder.parseStoredOrder(listing)
      if (!order) {
        console.error('Failed to parse order for approval check')
        return
      }

      // Get the correct approval target based on conduitKey
      const conduitKey = order.parameters?.conduitKey
      const approvalTarget = getApprovalTarget(conduitKey)

      console.log('Checking approval for:', {
        conduitKey,
        approvalTarget,
        currency: 'USDC',
      })

      // Check current allowance
      const allowance = await publicClient.readContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, approvalTarget as `0x${string}`],
      })

      // Check if allowance is sufficient
      const requiredAmount = BigInt(listing.price)
      setNeedsApproval(allowance < requiredAmount)
    } catch (err) {
      console.error('Failed to check approval:', err)
    }
  }

  const handleApprove = async () => {
    try {
      setError(null)
      setStep('approving')

      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }

      // Parse the order to get the conduitKey
      const order = orderBuilder.parseStoredOrder(listing)
      if (!order) {
        throw new Error('Invalid order data')
      }

      // Get the correct approval target based on conduitKey
      const conduitKey = order.parameters?.conduitKey
      const approvalTarget = getApprovalTarget(conduitKey)

      console.log('Approving USDC for:', {
        conduitKey,
        approvalTarget,
        amount: listing.price,
      })

      // Approve the conduit (or Seaport) to spend USDC
      const approveTx = await walletClient.writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [approvalTarget as `0x${string}`, BigInt(listing.price)],
      })

      setApproveTxHash(approveTx)

      // Wait for approval confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: approveTx,
        confirmations: 1,
      })

      if (receipt.status === 'success') {
        setNeedsApproval(false)
        setStep('review')
        // Automatically proceed to purchase
        handlePurchase()
      } else {
        throw new Error('Approval failed')
      }
    } catch (err: any) {
      console.error('Approval failed:', err)
      setError(err.message || 'Approval failed')
      setStep('error')
    }
  }

  const refetchDomainQueries = () => {
    queryClient.refetchQueries({ queryKey: ['name', 'details'] })
    queryClient.refetchQueries({ queryKey: ['portfolio', 'domains'] })
    queryClient.refetchQueries({ queryKey: ['my_offers'] })
  }

  const handlePurchase = async () => {
    try {
      setError(null)
      setStep('confirming')

      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }

      // Parse the stored order
      console.log('Listing:', listing)
      const order = orderBuilder.parseStoredOrder(listing)
      if (!order) {
        throw new Error('Invalid order data')
      }

      // Validate the order structure
      const validation = orderBuilder.validateOrder(order)
      if (!validation.valid) {
        throw new Error(validation.errors[0] || 'Invalid order')
      }

      // Build basic order parameters for efficient fulfillment
      const basicOrderParams = orderBuilder.buildBasicOrderParameters(order)

      // Calculate total payment
      const totalPayment = orderBuilder.calculateTotalPayment(order)
      const usesETH = orderBuilder.usesNativeToken(order)

      // For ERC20 orders or orders with OpenSea conduit, use standard fulfillOrder instead of the efficient basic route
      const isERC20Order = !usesETH
      const useAdvancedOrder = isERC20Order

      let tx: `0x${string}`

      // ADVANCED ORDER IS ANY ORDER THAT INCLUDES SENDING ERC20 TOKENS
      if (useAdvancedOrder) {
        const fulfillerConduitKey =
          order.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000'
        // Build advanced order
        const advancedOrder = orderBuilder.buildAdvancedOrder(order)

        // Simulate with fulfillAdvancedOrder
        try {
          await publicClient.simulateContract({
            address: SEAPORT_ADDRESS as `0x${string}`,
            abi: SEAPORT_ABI,
            functionName: 'fulfillAdvancedOrder',
            args: [
              // @ts-expect-error AdvancedOrder is of the correct type
              advancedOrder,
              [], // criteriaResolvers - empty for basic orders
              fulfillerConduitKey,
              address, // recipient
            ],
            value: usesETH ? totalPayment : BigInt(0),
            account: address,
          })
        } catch (simulateError: any) {
          console.error('Transaction simulation failed:', simulateError)
          throw new Error(`Transaction would fail: ${simulateError.shortMessage || simulateError.message}`)
        }

        setStep('processing')

        // Execute with fulfillAdvancedOrder
        tx = await walletClient.writeContract({
          address: SEAPORT_ADDRESS as `0x${string}`,
          abi: SEAPORT_ABI,
          functionName: 'fulfillAdvancedOrder',
          args: [
            // @ts-expect-error AdvancedOrder is of the correct type
            advancedOrder,
            [], // criteriaResolvers
            fulfillerConduitKey,
            address, // recipient
          ],
          value: usesETH ? totalPayment : BigInt(0),
          gas: gasEstimate || undefined, // Use estimated gas if available
        })

        setTxHash(tx)
      } else {
        const fulfillerConduitKey =
          order.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000'
        basicOrderParams.fulfillerConduitKey = fulfillerConduitKey as `0x${string}`

        // ETH orders use the efficient basic route
        try {
          await publicClient.simulateContract({
            address: SEAPORT_ADDRESS as `0x${string}`,
            abi: SEAPORT_ABI,
            functionName: 'fulfillBasicOrder_efficient_6GL6yc',
            args: [basicOrderParams],
            value: totalPayment,
            account: address,
          })
        } catch (simulateError: any) {
          console.error('Transaction simulation failed:', simulateError)
          throw new Error(`Transaction would fail: ${simulateError.shortMessage || simulateError.message}`)
        }

        setStep('processing')

        tx = await walletClient.writeContract({
          address: SEAPORT_ADDRESS as `0x${string}`,
          abi: SEAPORT_ABI,
          functionName: 'fulfillBasicOrder_efficient_6GL6yc',
          args: [basicOrderParams],
          value: totalPayment,
          gas: gasEstimate || undefined, // Use estimated gas if available
        })

        setTxHash(tx)
      }

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
        confirmations: 1,
      })

      if (receipt.status === 'success') {
        setStep('success')
        refetchDomainQueries()
        modifyCart({ domain, inCart: true, cartType: 'sales' })
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err: any) {
      console.error('Purchase failed:', err)
      setError(err.message || 'Transaction failed')
      setStep('error')
    }
  }

  const getModalContent = () => {
    switch (step) {
      case 'review':
        return (
          <div className='flex flex-col gap-3'>
            <div className='space-y-4'>
              <div className='flex flex-row items-center justify-between rounded-lg'>
                <p className='font-sedan-sc text-xl'>Name</p>
                <p className='text-xl font-semibold'>{domain.name || `Token #${domain.token_id}`}</p>
              </div>

              <div className='flex flex-row items-center justify-between rounded-lg'>
                <p className='font-sedan-sc text-xl'>Total Price</p>
                <Price
                  price={listing.price}
                  currencyAddress={listing.currency_address}
                  fontSize='text-xl font-semibold'
                  iconSize='16px'
                />
              </div>

              {gasEstimate && gasPrice && (
                <div className='flex flex-row items-center justify-between rounded-lg'>
                  <p className='font-sedan-sc text-xl'>Estimated Gas</p>
                  <div className='text-right'>
                    <p className='text-xl font-semibold'>
                      ~{formattedGasEstimate ? formattedGasEstimate.toString() : '<0.001'} ETH
                    </p>
                  </div>
                </div>
              )}

              {/* <div className='flex flex-row items-center justify-between rounded-lg'>
                <p className='font-sedan-sc text-xl'>Your Balance</p>
                <p className={`text-xl font-semibold ${!hasSufficientBalance ? 'text-red-400' : ''}`}>
                  {currentBalanceFormatted}
                </p>
              </div> */}
            </div>

            {needsApproval && (
              <div className='bg-secondary border-tertiary mt-4 rounded-lg border p-3'>
                <p className='text-sm'>
                  You need to approve USDC spending before purchasing. This is a one-time approval.
                </p>
              </div>
            )}

            {!hasSufficientBalance && !needsApproval && gasEstimate && gasPrice && (
              <div className='rounded-lg border border-red-500/20 bg-red-900/20 p-3'>
                <p className='text-md text-red-400'>
                  Insufficient balance. You need{' '}
                  {isETHListing
                    ? `${(Number((BigInt(listing.price) + (gasEstimate || BigInt(0)) * (gasPrice || BigInt(0))) / BigInt(10 ** 16)) / 100).toString()} ETH`
                    : `${(Number(listing.price) / Math.pow(10, TOKEN_DECIMALS.USDC)).toFixed(2)} USDC`}{' '}
                  to complete this purchase.
                </p>
              </div>
            )}

            <div className='flex w-full flex-col gap-2'>
              <PrimaryButton
                onClick={
                  isCorrectChain
                    ? needsApproval
                      ? handleApprove
                      : handlePurchase
                    : () => checkChain({ chainId: mainnet.id, onSuccess: () => handlePurchase() })
                }
                className='w-full'
                disabled={isCorrectChain ? !hasSufficientBalance && !needsApproval : false}
              >
                {isCorrectChain
                  ? !hasSufficientBalance && !needsApproval
                    ? `Insufficient ${isETHListing ? 'ETH' : 'USDC'} Balance`
                    : needsApproval
                      ? 'Approve USDC'
                      : 'Confirm Purchase'
                  : 'Switch Chain'}
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </div>
        )

      case 'approving':
        return (
          <>
            <h2 className='mb-6 text-2xl font-bold text-white'>Approve USDC</h2>
            <div className='py-8 text-center'>
              <div className='inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-purple-500'></div>
              <p className='mt-4 text-gray-400'>Approving USDC for Seaport</p>
              {approveTxHash && <p className='mt-2 font-mono text-xs break-all text-gray-500'>{approveTxHash}</p>}
            </div>
          </>
        )

      case 'confirming':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Confirm in Wallet</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Please confirm the transaction in your wallet</p>
            </div>
          </>
        )

      case 'processing':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Processing Transaction</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Transaction submitted</p>
              {txHash && <p className='mt-2 font-mono text-xs break-all text-gray-500'>{txHash}</p>}
            </div>
          </>
        )

      case 'success':
        return (
          <>
            <div className='flex flex-col items-center justify-between gap-2 py-4 text-center'>
              <div className='bg-primary mx-auto mb-2 flex w-fit items-center justify-center rounded-full p-2'>
                <Check className='text-background h-6 w-6' />
              </div>
              <div className='mb-2 text-xl font-bold'>Purchase Successful!</div>
            </div>
            <SecondaryButton onClick={onClose} className='w-full'>
              <p className='text-label text-lg font-bold'>Close</p>
            </SecondaryButton>
          </>
        )

      case 'error':
        return (
          <>
            <div className='mb-4 rounded-lg border border-red-500/20 bg-red-900/20 p-4'>
              <h2 className='mb-4 text-2xl font-bold text-red-400'>Transaction Failed</h2>
              <p className='line-clamp-6 text-red-400'>{error || 'An unknown error occurred'}</p>
            </div>
            <div className='flex w-full flex-col gap-2'>
              <PrimaryButton onClick={() => setStep('review')} className='w-full'>
                Try Again
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        )
    }
  }

  return (
    <div
      onClick={() => {
        if (step === 'review' || step === 'error') {
          onClose()
        }
        onClose()
      }}
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-primary bg-background relative flex w-full max-w-md flex-col rounded-md border-2 p-6'
      >
        {!poapClaimed && step === 'success' ? (
          <ClaimPoap />
        ) : (
          <>
            <h2 className='font-sedan-sc mb-6 text-center text-3xl'>Purchase Name</h2>
            {getModalContent()}
          </>
        )}
      </div>
    </div>
  )
}

export default BuyNowModal
