'use client'

import { useState, useEffect, useMemo } from 'react'
import { SeaportOrderBuilder } from '@/lib/seaport/orderBuilder'
import { useAccount, usePublicClient } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import {
  SEAPORT_ADDRESS,
  ENS_REGISTRAR_ADDRESS,
  ENS_NAME_WRAPPER_ADDRESS,
  OPENSEA_CONDUIT_ADDRESS,
  OPENSEA_CONDUIT_KEY,
  MARKETPLACE_CONDUIT_KEY,
  MARKETPLACE_CONDUIT_ADDRESS,
} from '@/constants/web3/contracts'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { SEAPORT_ABI } from '@/lib/seaport/abi'
import Price from '@/components/ui/price'
import { DomainOfferType } from '@/types/domains'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { Check } from 'ethereum-identity-kit'
import { useQueryClient } from '@tanstack/react-query'
import User from '@/components/ui/user'
import { acceptOffer as acceptOfferApi } from '@/api/offers/accept'
import { mainnet } from 'viem/chains'
import { ensureChain } from '@/utils/web3/ensureChain'
import { AcceptOfferDomain } from '@/state/reducers/modals/acceptOfferModal'
import ClaimPoap from '../poap/claimPoap'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { checkIfWrapped } from '@/api/domains/checkIfWrapped'
import { beautifyName } from '@/lib/ens'
import { CAN_CLAIM_POAP } from '@/constants'
import { NAME_WRAPPER_ABI } from '@/constants/abi/NameWrapper'
import { NFT_ABI } from '@/constants/abi/NFTAbi'
import { TOKENS } from '@/constants/web3/tokens'
import useETHPrice from '@/hooks/useETHPrice'
import { cn } from '@/utils/tailwind'
import { BigNumber } from '@ethersproject/bignumber'
import { formatPrice } from '@/utils/formatPrice'
import { AssetType } from '@/types/assets'

interface AcceptOfferModalProps {
  offer: DomainOfferType | null
  domain: AcceptOfferDomain | null
  onClose: () => void
}

type TransactionStep = 'review' | 'approving' | 'confirming' | 'processing' | 'success' | 'error'

const AcceptOfferModal: React.FC<AcceptOfferModalProps> = ({ offer, domain, onClose }) => {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const publicClient = usePublicClient()
  const getWalletClient = useGetWalletClient()
  const { poapClaimed } = useAppSelector(selectUserProfile)
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

  const ensName = beautifyName(domain.name)

  const estimateGas = async () => {
    try {
      if (!address || !publicClient) return

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
        const isOpenseaOrder = offer.source === 'opensea'
        const advancedOrder = orderBuilder.buildAdvancedOrder(order, isOpenseaOrder, address)
        const fulfillerConduitKey =
          advancedOrder.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000'

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
      const isWrapped = await checkIfWrapped(ensName)
      const nftContract = isWrapped ? ENS_NAME_WRAPPER_ADDRESS : ENS_REGISTRAR_ADDRESS

      console.log('Parameters:', offer)
      const conduitKey = offer.order_data.protocol_data.parameters.conduitKey
      const conduitAddress =
        conduitKey === OPENSEA_CONDUIT_KEY
          ? OPENSEA_CONDUIT_ADDRESS
          : conduitKey === MARKETPLACE_CONDUIT_KEY
            ? (MARKETPLACE_CONDUIT_ADDRESS as `0x${string}`)
            : (SEAPORT_ADDRESS as `0x${string}`)

      // console.log('Conduit address:', conduitAddress)

      // Check if Seaport is approved to transfer the NFT
      const isApproved = await publicClient.readContract({
        address: nftContract as `0x${string}`,
        abi: isWrapped ? NAME_WRAPPER_ABI : NFT_ABI,
        functionName: 'isApprovedForAll',
        args: [address, conduitAddress],
      })

      // console.log('Is approved:', isApproved)

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

      if (!address || !publicClient || !domain) {
        throw new Error('Wallet not connected')
      }

      const walletClient = await getWalletClient()

      // Determine which NFT contract to approve based on if the name is wrapped
      const isWrapped = await checkIfWrapped(ensName)
      const nftContract = isWrapped ? ENS_NAME_WRAPPER_ADDRESS : ENS_REGISTRAR_ADDRESS
      const conduitKey = offer.order_data.protocol_data.parameters.conduitKey
      const conduitAddress =
        conduitKey === OPENSEA_CONDUIT_KEY
          ? OPENSEA_CONDUIT_ADDRESS
          : conduitKey === MARKETPLACE_CONDUIT_KEY
            ? (MARKETPLACE_CONDUIT_ADDRESS as `0x${string}`)
            : (SEAPORT_ADDRESS as `0x${string}`)

      console.log('Conduit key:', conduitKey)
      console.log('Conduit address:', conduitAddress)
      console.log('NFT contract:', nftContract)
      console.log('Is wrapped:', isWrapped)
      console.log('Function name:', 'setApprovalForAll')
      console.log('Args:', [conduitAddress, true])

      // Ensure we're on mainnet before approving
      await ensureChain(walletClient, mainnet.id)

      // Approve Seaport to transfer the NFT
      const approveTx = await walletClient.writeContract({
        address: nftContract as `0x${string}`,
        abi: isWrapped ? NAME_WRAPPER_ABI : NFT_ABI,
        functionName: 'setApprovalForAll',
        args: [conduitAddress, true],
        chain: mainnet,
      })

      setApproveTxHash(approveTx)

      // Wait for approval confirmation
      const receipt = await waitForTransaction(publicClient, approveTx)

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
    queryClient.refetchQueries({ queryKey: ['profile', 'domains'] })
    queryClient.refetchQueries({ queryKey: ['received_offers'] })
    queryClient.refetchQueries({ queryKey: ['name', 'offers'] })
  }

  const handleAcceptOffer = async () => {
    try {
      setError(null)
      setStep('confirming')

      if (!address || !publicClient) {
        throw new Error('Wallet not connected')
      }

      const walletClient = await getWalletClient()

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

      const isOpenseaOrder = offer.source === 'opensea'
      // Build advanced order for offer acceptance
      const advancedOrder = orderBuilder.buildAdvancedOrder(order, isOpenseaOrder, address)
      const fulfillerConduitKey =
        order.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000'

      console.log('Fulfiller conduit key:', fulfillerConduitKey)
      console.log('Advanced order:', advancedOrder)
      console.log('Order:', order)
      console.log('Address:', address)

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

      // Ensure we're on mainnet before executing the transaction
      await ensureChain(walletClient, mainnet.id)

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
        chain: mainnet,
      })

      setTxHash(tx)

      // Wait for confirmation
      const receipt = await waitForTransaction(publicClient, tx)

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
              <div className='flex flex-row items-center justify-between rounded-lg'>
                <p className='font-sedan-sc text-xl'>Name</p>
                <p className='text-xl font-semibold'>{ensName || `Token #${domain.tokenId}`}</p>
              </div>

              <div className='flex flex-row items-center justify-between rounded-lg'>
                <p className='font-sedan-sc text-xl'>From</p>
                <div className='max-w-2/3 text-xl'>
                  <User address={offer.buyer_address} wrapperClassName='justify-start!' />
                </div>
              </div>

              <div className='flex flex-row items-center justify-between rounded-lg'>
                <p className='font-sedan-sc text-xl'>Expires</p>
                <p className='text-xl'>{new Date(offer.expires_at).toLocaleDateString()}</p>
              </div>

              {gasEstimate && gasPrice && (
                <div className='flex flex-row items-center justify-between rounded-lg'>
                  <p className='font-sedan-sc text-xl'>Estimated Gas</p>
                  <div className='text-right'>
                    <p className='text-xl font-semibold'>
                      ~
                      {((gasEstimate * gasPrice) / BigInt(10 ** 18)).toString() === '0'
                        ? '<0.001'
                        : (Number(gasEstimate * gasPrice) / 10 ** 18).toFixed(6)}{' '}
                      ETH
                    </p>
                    <p className='text-sm text-gray-400'>
                      {gasEstimate.toString()} units @ {(Number(gasPrice) / 10 ** 9).toFixed(2)} gwei
                    </p>
                  </div>
                </div>
              )}
              <PriceBreakdown offer={offer} />
            </div>

            {needsApproval && (
              <div className='text-md p-sm mb-2 rounded-lg text-center'>
                You need to approve Seaport to transfer your NFT. This is a one time approval.
              </div>
            )}

            <div className='flex w-full flex-col gap-2'>
              <PrimaryButton
                onClick={needsApproval ? handleApprove : handleAcceptOffer}
                className='w-full'
                // disabled={isCorrectChain ? needsApproval : false}
              >
                {needsApproval ? 'Approve NFT Transfer' : 'Accept Offer'}
              </PrimaryButton>
              <SecondaryButton onClick={onClose} className='w-full'>
                Close
              </SecondaryButton>
            </div>
          </>
        )

      case 'approving':
        return (
          <>
            <h2 className='mt-4 text-center text-xl font-bold'>Approving NFT Transfer</h2>
            <div className='flex flex-col items-center justify-center gap-8 pt-8 pb-4 text-center'>
              <div className='border-primary inline-block h-12 w-12 animate-spin rounded-full border-b-2'></div>
              <p className='text-neutral text-lg'>Approving Seaport to transfer your Name</p>
              {approveTxHash && (
                <a
                  href={`https://etherscan.io/tx/${approveTxHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              )}
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
              {txHash && (
                <a
                  href={`https://etherscan.io/tx/${txHash}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:text-primary/80 text-lg underline transition-colors'
                >
                  View on Etherscan
                </a>
              )}{' '}
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
              <p className='flex flex-row items-center gap-1 text-gray-400'>
                You have successfully sold {ensName} for
                <Price
                  price={offer.offer_amount_wei}
                  currencyAddress={offer.currency_address}
                  fontSize='text-base'
                  iconSize='14px'
                />
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
      }}
      className='fixed inset-0 z-50 flex h-[100dvh] w-screen items-end justify-end bg-black/50 backdrop-blur-sm transition-all duration-250 md:items-center md:justify-center md:p-4 starting:translate-y-[100vh] md:starting:translate-y-0'
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
        }}
        className='border-tertiary bg-background relative flex max-h-[calc(100dvh-80px)] w-full flex-col overflow-y-auto border-t p-6 md:max-w-md md:rounded-md md:border-2'
      >
        {step === 'success' && CAN_CLAIM_POAP && !poapClaimed ? (
          <ClaimPoap />
        ) : (
          <>
            <h2 className='font-sedan-sc mb-6 min-h-6 text-center text-3xl'>Accept Offer</h2>
            {getModalContent()}
          </>
        )}
      </div>
    </div>
  )
}

const PriceBreakdown: React.FC<{ offer: DomainOfferType }> = ({ offer }) => {
  const { ethPrice } = useETHPrice()

  const feePercentage = useMemo(() => {
    switch (offer.source) {
      case 'grails':
        return 0
      case 'opensea':
        return 0.01
      default:
        return 0
    }
  }, [offer])

  const currencySymbol = TOKENS[offer.currency_address as keyof typeof TOKENS] as AssetType
  const formattedPrice = formatPrice(BigNumber.from(offer.offer_amount_wei).toString(), currencySymbol, true)
  const feePrice = Number(formattedPrice) * feePercentage
  const netProceeds = Number(formattedPrice) - feePrice
  const includeUSDPrices = currencySymbol === 'ETH' || currencySymbol === 'WETH'

  return (
    <div className='bg-secondary border-tertiary text-md rounded-md border p-3'>
      <div className='space-y-1'>
        <div className='flex justify-between text-gray-400'>
          <p className='text-lg font-semibold'>Offer amount:</p>
          <div className='flex flex-col items-end gap-px'>
            <p>
              {formattedPrice} {currencySymbol}
            </p>
            {includeUSDPrices && (
              <p className='text-sm font-medium'>
                ($
                {(Number(formattedPrice) * ethPrice).toLocaleString(navigator?.language ?? 'en-US', {
                  maximumFractionDigits: 2,
                })}
                )
              </p>
            )}
          </div>
        </div>
        <div
          className={cn(
            'flex justify-between text-lg font-medium',
            feePercentage > 0 ? 'text-red-400' : 'text-green-400'
          )}
        >
          <p className='pt-px'>
            - {feePercentage * 100}% fee (<span className='capitalize'>{offer.source}</span>):
          </p>
          <div className='flex flex-col items-end gap-px'>
            <p>
              {feePrice} {TOKENS[offer.currency_address as keyof typeof TOKENS]}
            </p>
            {feePercentage > 0 && includeUSDPrices && (
              <p className='text-sm font-medium'>
                ($
                {(feePrice * ethPrice).toLocaleString(navigator?.language ?? 'en-US', {
                  maximumFractionDigits: 2,
                })}
                )
              </p>
            )}
          </div>
        </div>
        <div className='bg-primary my-2 h-px w-full' />
        <div className='flex justify-between font-medium'>
          <p className='text-lg font-semibold'>You Receive:</p>
          <div className='flex flex-col items-end gap-px'>
            <p className='text-lg font-bold'>
              {netProceeds.toLocaleString('default', {
                maximumFractionDigits: 6,
                minimumFractionDigits: 2,
              })}{' '}
              {currencySymbol}
            </p>
            {includeUSDPrices && (
              <p className='text-neutral text-sm font-medium'>
                ($
                {(netProceeds * ethPrice).toLocaleString(navigator?.language ?? 'en-US', {
                  maximumFractionDigits: 2,
                })}
                )
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AcceptOfferModal
