'use client'

import { useState, useEffect } from 'react'
import { SeaportOrderBuilder } from '@/lib/seaport/orderBuilder'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import {
  SEAPORT_ADDRESS,
  MARKETPLACE_CONDUIT_ADDRESS,
  MARKETPLACE_CONDUIT_KEY,
  OPENSEA_CONDUIT_ADDRESS,
  OPENSEA_CONDUIT_KEY,
} from '@/constants/web3/contracts'
import { USDC_ADDRESS } from '@/constants/web3/tokens'
import { SEAPORT_ABI } from '@/lib/seaport/abi'
import Price from '@/components/ui/price'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { Check } from 'ethereum-identity-kit'
import { useQueryClient } from '@tanstack/react-query'

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
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()

  const [step, setStep] = useState<TransactionStep>('review')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null)
  const [gasPrice, setGasPrice] = useState<bigint | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null)

  const orderBuilder = new SeaportOrderBuilder()

  useEffect(() => {
    // Estimate gas and check approval when modal opens
    estimateGas()
    checkApproval()
  }, [])

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

      // Get current gas price
      const currentGasPrice = await publicClient.getGasPrice()
      setGasPrice(currentGasPrice)

      try {
        if (isERC20Order) {
          // For ERC20 orders, estimate gas for fulfillAdvancedOrder
          const fulfillerConduitKey = order.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000'
          const advancedOrder = orderBuilder.buildAdvancedOrder(order)

          estimatedGas = await publicClient.estimateContractGas({
            address: SEAPORT_ADDRESS as `0x${string}`,
            abi: SEAPORT_ABI,
            functionName: 'fulfillAdvancedOrder',
            args: [
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
          const basicOrderParams = orderBuilder.buildBasicOrderParameters(order, address)

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
      const basicOrderParams = orderBuilder.buildBasicOrderParameters(order, address)

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
          <>
            <div className='mb-6 space-y-4'>
              <div className='rounded-lg flex flex-row items-center justify-between'>
                <p className='text-xl font-sedan-sc'>Name</p>
                <p className='text-xl font-semibold'>{domain.name || `Token #${domain.token_id}`}</p>
              </div>

              <div className='rounded-lg flex flex-row items-center justify-between'>
                <p className='text-xl font-sedan-sc'>Total Price</p>
                <Price price={listing.price} currencyAddress={listing.currency_address} fontSize='text-xl font-semibold' iconSize='16px' />
              </div>

              {gasEstimate && gasPrice && (
                <div className='rounded-lg flex flex-row items-center justify-between'>
                  <p className='text-xl font-sedan-sc'>Estimated Gas</p>
                  <div className='text-right'>
                    <p className='text-xl font-semibold'>
                      ~{((gasEstimate * gasPrice) / BigInt(10 ** 18)).toString() === '0'
                        ? '<0.001'
                        : (Number(gasEstimate * gasPrice) / 10 ** 18).toFixed(6)} ETH
                    </p>
                    <p className='text-sm text-gray-400'>
                      {gasEstimate.toString()} units @ {(Number(gasPrice) / 10 ** 9).toFixed(2)} gwei
                    </p>
                  </div>
                </div>
              )}
            </div>

            {needsApproval && (
              <div className='mt-4 rounded-lg border bg-secondary border-tertiary'>
                <p className='text-md'>
                  You need to approve USDC spending before purchasing. This is a one-time approval.
                </p>
              </div>
            )}

            <div className='flex flex-col gap-2 w-full'>
              <PrimaryButton
                onClick={needsApproval ? handleApprove : handlePurchase}
                className='w-full'
              >
                {needsApproval ? 'Approve USDC' : 'Confirm Purchase'}
              </PrimaryButton>
              <SecondaryButton
                onClick={onClose}
                className='w-full'
              >
                Close
              </SecondaryButton>
            </div>
          </>
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
            <h2 className='mt-4 text-xl font-bold text-center'>Confirm in Wallet</h2>
            <div className='pt-8 pb-4 text-center flex flex-col items-center justify-center gap-8'>
              <div className='inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary'></div>
              <p className='text-neutral text-lg'>Please confirm the transaction in your wallet</p>
            </div>
          </>
        )

      case 'processing':
        return (
          <>
            <h2 className='mt-4 text-xl font-bold text-center'>Processing Transaction</h2>
            <div className='pt-8 pb-4 text-center flex flex-col items-center justify-center gap-8'>
              <div className='inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary'></div>
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
              <p className='text-red-400 line-clamp-6'>{error || 'An unknown error occurred'}</p>
            </div>
            <div className='flex flex-col gap-2 w-full'>
              <PrimaryButton
                onClick={() => setStep('review')}
                className='w-full'
              >
                Try Again
              </PrimaryButton>
              <SecondaryButton
                onClick={onClose}
                className='w-full'
              >
                Close
              </SecondaryButton>
            </div>
          </>
        )
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm'>
      <div className='relative w-full border-2 flex flex-col border-primary max-w-md rounded-2xl bg-secondary p-6'>
        <h2 className='mb-6 text-3xl text-center font-sedan-sc'>Buy Domain</h2>

        {getModalContent()}
      </div>
    </div>
  )
}

export default BuyNowModal
