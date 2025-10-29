'use client'

import { useState, useEffect } from 'react'
import { SeaportOrderBuilder } from '@/lib/seaport/orderBuilder'
import { useAccount, usePublicClient, useWalletClient } from 'wagmi'
import {
  SEAPORT_ADDRESS,
  ENS_REGISTRAR_ADDRESS,
  ENS_NAME_WRAPPER_ADDRESS,
} from '@/constants/web3/contracts'
import { SEAPORT_ABI } from '@/lib/seaport/abi'
import Price from '@/components/ui/price'
import { DomainOfferType, MarketplaceDomainType } from '@/types/domains'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { Check } from 'ethereum-identity-kit'
import { useQueryClient } from '@tanstack/react-query'
import User from '@/components/ui/user'
import { acceptOffer as acceptOfferApi } from '@/api/offers/accept'

interface AcceptOfferModalProps {
  offer: DomainOfferType | null
  domain: MarketplaceDomainType | null
  onClose: () => void
}

type TransactionStep = 'review' | 'approving' | 'confirming' | 'processing' | 'success' | 'error'

// ERC721/ERC1155 ABI for approve functions
const NFT_ABI = [
  {
    inputs: [
      { name: 'operator', type: 'address' },
      { name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

const AcceptOfferModal: React.FC<AcceptOfferModalProps> = ({ offer, domain, onClose }) => {
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
    if (offer && domain) {
      estimateGas()
      checkApproval()
    }
  }, [offer, domain])

  if (!offer || !domain) return null

  const estimateGas = async () => {
    try {
      if (!address || !walletClient || !publicClient) return

      console.log('Offer data:', offer)
      console.log('Order data:', offer.order_data)

      // Parse the stored order from offer data
      const order = orderBuilder.parseStoredOrder(offer)
      if (!order) {
        console.error('Failed to parse order from offer:', offer)
        setError('Invalid offer data')
        return
      }

      // Get current gas price
      const currentGasPrice = await publicClient.getGasPrice()
      setGasPrice(currentGasPrice)

      try {
        // For accepting offers, we use fulfillAdvancedOrder
        const fulfillerConduitKey = '0x0000000000000000000000000000000000000000000000000000000000000000'
        const advancedOrder = orderBuilder.buildAdvancedOrder(order)

        const estimatedGas = await publicClient.estimateContractGas({
          address: SEAPORT_ADDRESS as `0x${string}`,
          abi: SEAPORT_ABI,
          functionName: 'fulfillAdvancedOrder',
          args: [
            advancedOrder,
            [], // criteriaResolvers
            fulfillerConduitKey,
            address, // recipient
          ],
          value: BigInt(0), // Offers don't require ETH value
          account: address,
        })

        // Add 20% buffer to the estimated gas
        const gasWithBuffer = (estimatedGas * BigInt(120)) / BigInt(100)
        setGasEstimate(gasWithBuffer)
      } catch (estimateError) {
        console.warn('Failed to estimate gas, using fallback:', estimateError)
        setGasEstimate(BigInt(400000))
      }
    } catch (err) {
      console.error('Failed to estimate gas:', err)
      setGasEstimate(BigInt(400000))
    }
  }

  const checkApproval = async () => {
    try {
      if (!address || !publicClient || !domain) return

      // Determine which NFT contract to check based on if the name is wrapped
      const isWrapped = domain.metadata?.is_wrapped === 'true'
      const nftContract = isWrapped ? ENS_NAME_WRAPPER_ADDRESS : ENS_REGISTRAR_ADDRESS

      // Check if Seaport is approved to transfer the NFT
      const isApproved = await publicClient.readContract({
        address: nftContract as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'isApprovedForAll',
        args: [address, SEAPORT_ADDRESS as `0x${string}`],
      })

      setNeedsApproval(!isApproved)
    } catch (err) {
      console.error('Failed to check approval:', err)
      setNeedsApproval(true)
    }
  }

  const handleApprove = async () => {
    try {
      setError(null)
      setStep('approving')

      if (!address || !walletClient || !publicClient || !domain) {
        throw new Error('Wallet not connected')
      }

      // Determine which NFT contract to approve based on if the name is wrapped
      const isWrapped = domain.metadata?.is_wrapped === 'true'
      const nftContract = isWrapped ? ENS_NAME_WRAPPER_ADDRESS : ENS_REGISTRAR_ADDRESS

      // Approve Seaport to transfer the NFT
      const approveTx = await walletClient.writeContract({
        address: nftContract as `0x${string}`,
        abi: NFT_ABI,
        functionName: 'setApprovalForAll',
        args: [SEAPORT_ADDRESS as `0x${string}`, true],
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
        // Automatically proceed to accept offer
        handleAcceptOffer()
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
    queryClient.refetchQueries({ queryKey: ['received_offers'] })
    queryClient.refetchQueries({ queryKey: ['offers'] })
  }

  const handleAcceptOffer = async () => {
    try {
      setError(null)
      setStep('confirming')

      if (!address || !walletClient || !publicClient) {
        throw new Error('Wallet not connected')
      }

      // Parse the stored order from offer data
      console.log('Accepting offer:', offer)
      console.log('Order data:', offer.order_data)

      const order = orderBuilder.parseStoredOrder(offer)
      if (!order) {
        console.error('Failed to parse order for acceptance:', offer)
        throw new Error('Invalid offer data')
      }

      // Validate the order structure
      const validation = orderBuilder.validateOrder(order)
      if (!validation.valid) {
        throw new Error(validation.errors[0] || 'Invalid offer')
      }

      // Build advanced order for offer acceptance
      const advancedOrder = orderBuilder.buildAdvancedOrder(order)
      const fulfillerConduitKey = order.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000'

      // Simulate the transaction
      try {
        await publicClient.simulateContract({
          address: SEAPORT_ADDRESS as `0x${string}`,
          abi: SEAPORT_ABI,
          functionName: 'fulfillAdvancedOrder',
          args: [
            advancedOrder,
            [], // criteriaResolvers
            fulfillerConduitKey,
            address, // recipient of the payment
          ],
          value: BigInt(0), // Offers don't require ETH
          account: address,
        })
      } catch (simulateError: any) {
        console.error('Transaction simulation failed:', simulateError)
        throw new Error(`Transaction would fail: ${simulateError.shortMessage || simulateError.message}`)
      }

      setStep('processing')

      // Execute the transaction
      const tx = await walletClient.writeContract({
        address: SEAPORT_ADDRESS as `0x${string}`,
        abi: SEAPORT_ABI,
        functionName: 'fulfillAdvancedOrder',
        args: [
          advancedOrder,
          [], // criteriaResolvers
          fulfillerConduitKey,
          address, // recipient
        ],
        value: BigInt(0),
        gas: gasEstimate || undefined,
      })

      setTxHash(tx)

      // Wait for confirmation
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: tx,
        confirmations: 1,
      })

      if (receipt.status === 'success') {
        // Call API to mark offer as accepted
        await acceptOfferApi(offer.id)

        setStep('success')
        refetchDomainQueries()

        // TODO: Call API to update offer status
        // await updateOfferStatus(offer.id, 'accepted')
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err: any) {
      console.error('Accept offer failed:', err)
      setError(err.message || 'Transaction failed')
      setStep('error')
    }
  }

  const getModalContent = () => {
    switch (step) {
      case 'review':
        return (
          <>
            <div className='mb-4 space-y-4'>
              <div className='rounded-lg flex flex-row items-center justify-between'>
                <p className='text-xl font-sedan-sc'>Name</p>
                <p className='text-xl font-semibold'>{domain.name || `Token #${domain.token_id}`}</p>
              </div>

              <div className='rounded-lg flex flex-row items-center justify-between'>
                <p className='text-xl font-sedan-sc'>Offer Amount</p>
                <Price price={offer.offer_amount_wei} currencyAddress={offer.currency_address} fontSize='text-xl font-semibold' iconSize='16px' />
              </div>

              <div className='rounded-lg flex flex-row items-center justify-between'>
                <p className='text-xl font-sedan-sc'>From</p>
                <div className='text-xl max-w-2/3'>
                  <User address={offer.buyer_address} />
                </div>
              </div>

              <div className='rounded-lg flex flex-row items-center justify-between'>
                <p className='text-xl font-sedan-sc'>Expires</p>
                <p className='text-xl'>
                  {new Date(offer.expires_at).toLocaleDateString()}
                </p>
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
              <div className='mb-2 p-3 rounded-lg border bg-secondary border-tertiary text-sm'>
                You need to approve Seaport to transfer your NFT. This is a one-time approval.
              </div>
            )}

            <div className='flex flex-col gap-2 w-full'>
              <PrimaryButton
                onClick={needsApproval ? handleApprove : handleAcceptOffer}
                className='w-full'
              >
                {needsApproval ? 'Approve NFT Transfer' : 'Accept Offer'}
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
            <h2 className='mt-4 text-xl font-bold text-center'>Approving NFT Transfer</h2>
            <div className='pt-8 pb-4 text-center flex flex-col items-center justify-center gap-8'>
              <div className='inline-block h-12 w-12 animate-spin rounded-full border-b-2 border-primary'></div>
              <p className='text-neutral text-lg'>Approving Seaport to transfer your NFT</p>
              {approveTxHash && <p className='mt-2 font-mono text-xs break-all text-neutral'>{approveTxHash}</p>}
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
              {txHash && <p className='mt-2 font-mono text-xs break-all text-neutral'>{txHash}</p>}
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
              <div className='mb-2 text-xl font-bold'>Offer Accepted!</div>
              <p className='text-gray-400'>
                You have successfully sold {domain.name} for{' '}
                <Price price={offer.offer_amount_wei} currencyAddress={offer.currency_address} fontSize='text-base' iconSize='14px' />
              </p>
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
        <h2 className='mb-6 text-3xl text-center font-sedan-sc'>Accept Offer</h2>

        {getModalContent()}
      </div>
    </div>
  )
}

export default AcceptOfferModal