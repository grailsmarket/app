'use client'

import { useState, useEffect, useMemo } from 'react'
import { SeaportOrderBuilder } from '@/lib/seaport/orderBuilder'
import { useAccount, usePublicClient, useBalance, useGasPrice } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { USDC_ADDRESS, ETH_ADDRESS, TOKEN_DECIMALS } from '@/constants/web3/tokens'
import { SEAPORT_ABI } from '@/lib/seaport/abi'
import {
  estimateGasWithFallback,
  withGasBuffer,
  FILL_GAS_FALLBACK_ERC20,
  FILL_GAS_FALLBACK_ETH,
} from '@/lib/seaport/gas'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { refreshEnsQueries } from '@/utils/refreshEnsQueries'
import Price from '@/components/ui/price'
import { DomainListingType, MarketplaceDomainType } from '@/types/domains'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import AssetSummary from '@/components/ui/modal/assetSummary'
import DetailList from '@/components/ui/modal/detailList'
import Notice from '@/components/ui/modal/notice'
import TxStatus from '@/components/ui/modal/txStatus'
import TxSteps, { type TxStep } from '@/components/ui/modal/txSteps'
import TxLink from '@/components/ui/modal/txLink'
import NameImage from '@/components/ui/nameImage'
import { beautifyName } from '@/lib/ens'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import useModifyCart from '@/hooks/useModifyCart'
import { activeChain } from '@/constants/web3/chain'
import { ensureChain } from '@/utils/web3/ensureChain'
import { useAppDispatch, useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import ClaimPoap from '../poap/claimPoap'
import { selectMarketplaceDomains } from '@/state/reducers/domains/marketplaceDomains'
import { fetchNameMetadata, formatNameMetadataRecord } from '@/api/name/metadata'
import Image from 'next/image'
import {
  setEditRecordsModalMetadata,
  setEditRecordsModalName,
  setEditRecordsModalVersion,
  setEditRecordsModalOpen,
} from '@/state/reducers/modals/editRecordsModal'
import PencilIcon from 'public/icons/pencil-primary.svg'
import { track } from '@/lib/analytics'
import { config } from '@/lib/config'
import { useUserContext } from '@/context/user'
import { fetchListingOrderData } from '@/api/listings/fetchListing'
import useMaliciousApprovals from '@/hooks/useMaliciousApprovals'
import RevokeApprovalsNotice from '@/components/compromised/revokeApprovalsNotice'
import { COMPROMISED_LISTING_TOOLTIP, isBlockedByCompromise } from '@/utils/compromised'

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
const getApprovalTarget = (conduitKey: string | undefined): string => {
  if (!conduitKey || conduitKey === '0x0000000000000000000000000000000000000000000000000000000000000000') {
    // No conduit key or zero hash means approve Seaport directly
    return config.seaportAddress
  }

  // Match against known conduit keys
  if (conduitKey.toLowerCase() === config.openseaConduitKey.toLowerCase()) {
    return config.openseaConduitAddress
  }

  if (conduitKey.toLowerCase() === config.conduitKey.toLowerCase()) {
    return config.conduitAddress
  }

  // Default to Seaport if unknown conduit key
  console.warn('Unknown conduit key:', conduitKey, '- defaulting to Seaport')
  return config.seaportAddress
}

const BuyNowModal: React.FC<BuyNowModalProps> = ({ listing, domain, onClose }) => {
  const { address } = useAccount()
  const dispatch = useAppDispatch()
  const queryClient = useQueryClient()
  const { modifyCart } = useModifyCart()
  const publicClient = usePublicClient({ chainId: activeChain.id })
  const { data: gasPrice } = useGasPrice()
  const getWalletClient = useGetWalletClient()
  const orderBuilder = new SeaportOrderBuilder()
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const { cartRegisteredDomains, cartUnregisteredDomains } = useAppSelector(selectMarketplaceDomains)

  const [step, setStep] = useState<TransactionStep>('review')
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null)

  const {
    data: nameMetadata,
    isLoading: isNameMetadataLoading,
    refetch: refetchNameMetadata,
    isRefetching: isNameMetadataRefetching,
    isError: isNameMetadataError,
  } = useQuery({
    queryKey: ['metadata', domain?.name],
    queryFn: async () => {
      if (!domain?.name) return null
      const result = await fetchNameMetadata(domain?.name || '')
      return formatNameMetadataRecord(result)
    },
    enabled: !!domain?.name,
  })

  // Get balances
  const { data: ethBalance } = useBalance({
    address,
    chainId: activeChain.id,
  })

  const { data: usdcBalance } = useBalance({
    address,
    token: USDC_ADDRESS as `0x${string}`,
    chainId: activeChain.id,
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

  const formattedGasEstimate = useMemo(() => {
    if (!gasPrice || !gasEstimate) return null
    return Number((gasEstimate * gasPrice) / BigInt(10 ** 12)) / 10 ** 6
  }, [gasPrice, gasEstimate])

  // Unsafe approvals from known exploits (e.g. the Magic Eden PPv2 drain) must be revoked first
  const approvalCheck = useMaliciousApprovals()

  // Stolen names: the public API withholds order_data; an allowed wallet fetches it authenticated
  const isCompromiseBlocked = isBlockedByCompromise(domain?.compromised, address)
  // Only fetch once signed in (the API returns order_data solely to an authenticated allowed wallet);
  // authStatus is in the key so completing sign-in triggers a fresh request.
  const { authStatus } = useUserContext()
  const isAuthenticated = authStatus === 'authenticated'
  const needsOrderData = !!listing && !!domain?.compromised && !isCompromiseBlocked && !listing.order_data
  const { data: fetchedOrderData, isLoading: isOrderDataLoading } = useQuery({
    queryKey: ['listing', 'order-data', listing?.id, address, authStatus],
    queryFn: () => fetchListingOrderData(listing!.id),
    enabled: needsOrderData && isAuthenticated,
    staleTime: 0,
  })
  const orderListing = useMemo(
    () => (listing && fetchedOrderData ? { ...listing, order_data: fetchedOrderData } : listing),
    [listing, fetchedOrderData]
  )
  const isOrderUnavailable = isCompromiseBlocked || !orderListing?.order_data

  useEffect(() => {
    // Recheck for the connected wallet once the listing's order data is available.
    if (listing && domain && !isOrderUnavailable) {
      estimateGas()
      checkApproval()
    } else {
      setGasEstimate(null)
      setNeedsApproval(false)
    }
  }, [orderListing, address, publicClient, isOrderUnavailable])

  if (!listing || !domain || !orderListing) return null

  const estimateGas = async () => {
    try {
      if (!address || !publicClient) return

      const order = orderBuilder.parseStoredOrder(orderListing)
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
            address: config.seaportAddress,
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
          const basicOrderParams = orderBuilder.buildBasicOrderParameters(order)

          estimatedGas = await publicClient.estimateContractGas({
            address: config.seaportAddress,
            abi: SEAPORT_ABI,
            functionName: 'fulfillBasicOrder_efficient_6GL6yc',
            args: [basicOrderParams],
            value: totalPayment,
            account: address,
          })
        }

        setGasEstimate(withGasBuffer(estimatedGas))
      } catch (estimateError) {
        // Usually means the USDC approval isn't in place yet; handlePurchase re-estimates before sending
        console.warn('Failed to estimate gas, using fallback:', estimateError)
        setGasEstimate(isERC20Order ? FILL_GAS_FALLBACK_ERC20 : FILL_GAS_FALLBACK_ETH)
      }
    } catch (err) {
      console.error('Failed to estimate gas:', err)
      setGasEstimate(FILL_GAS_FALLBACK_ERC20)
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
      const order = orderBuilder.parseStoredOrder(orderListing)
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

  const showError = (err: any, fallback: string) => {
    const message: string = err?.message || fallback
    // viem errors carry a one-line shortMessage; the full message goes behind "Error details"
    const shortMessage: string = err?.shortMessage || message
    setError(shortMessage)
    setErrorDetails(message !== shortMessage ? message : null)
    setStep('error')
  }

  const checkPurchaseAllowed = () => {
    if (isCompromiseBlocked) throw new Error(COMPROMISED_LISTING_TOOLTIP)
    if (isOrderUnavailable) throw new Error('This listing is not available.')
    if (approvalCheck.blocksTrading) {
      throw new Error(
        approvalCheck.hasMaliciousApprovals
          ? 'Revoke the unsafe ENS approval before purchasing'
          : 'Wallet approval check has not completed'
      )
    }
  }

  const handleApprove = async () => {
    try {
      checkPurchaseAllowed()
      setError(null)
      setApproveTxHash(null)
      setStep('approving')

      if (!address || !publicClient) {
        throw new Error('Wallet not connected')
      }

      const walletClient = await getWalletClient()

      // Parse the order to get the conduitKey
      const order = orderBuilder.parseStoredOrder(orderListing)
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

      // Ensure we're on the ENS chain before approving
      await ensureChain(walletClient, activeChain.id)

      // Approve the conduit (or Seaport) to spend USDC
      const approveTx = await walletClient.writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [approvalTarget as `0x${string}`, BigInt(listing.price)],
        chain: activeChain,
      })

      setApproveTxHash(approveTx)

      // Wait for approval confirmation
      const receipt = await waitForTransaction(publicClient, approveTx)

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
      showError(err, 'Approval failed')
    }
  }

  const handlePurchase = async () => {
    try {
      checkPurchaseAllowed()
      setError(null)
      setTxHash(null)
      setStep('confirming')

      if (!address || !publicClient) {
        throw new Error('Wallet not connected')
      }

      const walletClient = await getWalletClient()

      // Parse the stored order
      console.log('Listing:', listing)
      const order = orderBuilder.parseStoredOrder(orderListing)
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
            address: config.seaportAddress,
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

        // Re-estimate now that any USDC approval has landed; the estimate from when the
        // modal opened may have failed and fallen back to a fixed limit.
        const gas = await estimateGasWithFallback(
          () =>
            publicClient.estimateContractGas({
              address: config.seaportAddress,
              abi: SEAPORT_ABI,
              functionName: 'fulfillAdvancedOrder',
              args: [advancedOrder, [], fulfillerConduitKey, address],
              value: usesETH ? totalPayment : BigInt(0),
              account: address,
            }),
          FILL_GAS_FALLBACK_ERC20
        )

        setStep('processing')

        // Ensure we're on the ENS chain before executing the transaction
        await ensureChain(walletClient, activeChain.id)

        // Execute with fulfillAdvancedOrder
        tx = await walletClient.writeContract({
          address: config.seaportAddress,
          abi: SEAPORT_ABI,
          functionName: 'fulfillAdvancedOrder',
          args: [
            advancedOrder,
            [], // criteriaResolvers
            fulfillerConduitKey,
            address, // recipient
          ],
          value: usesETH ? totalPayment : BigInt(0),
          gas,
          chain: activeChain,
        })

        setTxHash(tx)
      } else {
        const fulfillerConduitKey =
          order.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000'
        basicOrderParams.fulfillerConduitKey = fulfillerConduitKey as `0x${string}`

        // ETH orders use the efficient basic route
        try {
          await publicClient.simulateContract({
            address: config.seaportAddress,
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

        const gas = await estimateGasWithFallback(
          () =>
            publicClient.estimateContractGas({
              address: config.seaportAddress,
              abi: SEAPORT_ABI,
              functionName: 'fulfillBasicOrder_efficient_6GL6yc',
              args: [basicOrderParams],
              value: totalPayment,
              account: address,
            }),
          FILL_GAS_FALLBACK_ETH
        )

        setStep('processing')

        // Ensure we're on the ENS chain before executing the transaction
        await ensureChain(walletClient, activeChain.id)

        tx = await walletClient.writeContract({
          address: config.seaportAddress,
          abi: SEAPORT_ABI,
          functionName: 'fulfillBasicOrder_efficient_6GL6yc',
          args: [basicOrderParams],
          value: totalPayment,
          gas,
          chain: activeChain,
        })

        setTxHash(tx)
      }

      // Wait for confirmation
      const receipt = await waitForTransaction(publicClient, tx)

      if (receipt.status === 'success') {
        setStep('success')
        track('buy_completed', {
          name: domain?.name,
          listing_source: listing?.source ?? null,
          price_wei: listing?.price_wei ?? null,
          currency_address: listing?.currency_address ?? null,
          tx_hash: tx,
        })
        refetchNameMetadata()
        refreshEnsQueries(queryClient, receipt)
        const cartDomain =
          cartRegisteredDomains.find((cartDomain) => cartDomain.token_id === domain.token_id) ||
          cartUnregisteredDomains.find((cartDomain) => cartDomain.token_id === domain.token_id)
        if (cartDomain) {
          modifyCart({ domain: cartDomain, inCart: true, cartType: cartDomain.cartType })
        }
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err: any) {
      console.error('Purchase failed:', err)
      showError(err, 'Transaction failed')
    }
  }

  const ensName = domain.name ? beautifyName(domain.name) : `Token #${domain.token_id}`
  const isBusy = step === 'approving' || step === 'confirming' || step === 'processing'
  const showPoapClaim = config.canClaimPoap && !poapClaimed && step === 'success'
  const gasLabel =
    gasEstimate && gasPrice ? `~${formattedGasEstimate ? formattedGasEstimate.toString() : '<0.001'} ETH` : null
  const showInsufficientBalance = !hasSufficientBalance && !needsApproval && !!gasEstimate && !!gasPrice
  const canEditRecords =
    !isNameMetadataLoading &&
    !isNameMetadataRefetching &&
    !isNameMetadataError &&
    nameMetadata &&
    Object.keys(nameMetadata).length > 0
  const listingSource = listing.source === 'grails' ? 'Grails' : listing.source === 'opensea' ? 'OpenSea' : null

  // Only shown while a transaction is in flight (approving, confirming, processing).
  const getPurchaseSteps = (): TxStep[] => {
    const purchaseSubmitted = step === 'processing' && !!txHash
    const confirmStatus: TxStep['status'] = step === 'approving' ? 'upcoming' : purchaseSubmitted ? 'done' : 'active'
    const onchainStatus: TxStep['status'] = purchaseSubmitted ? 'active' : 'upcoming'

    const steps: TxStep[] = [
      {
        key: 'confirm',
        label: 'Confirm Purchase',
        status: confirmStatus,
        detail: confirmStatus === 'active' ? 'Waiting for your signature' : undefined,
      },
      {
        key: 'onchain',
        label: 'Onchain Confirmation',
        status: onchainStatus,
        detail: onchainStatus === 'active' ? 'Transaction submitted' : undefined,
        hash: onchainStatus === 'active' ? txHash : null,
      },
    ]

    if (needsApproval || approveTxHash) {
      const isApproving = step === 'approving'

      steps.unshift({
        key: 'approve',
        label: 'Approve USDC',
        status: isApproving ? 'active' : 'done',
        detail: isApproving ? (approveTxHash ? 'Approving USDC for Seaport' : 'Waiting for your signature') : undefined,
        hash: approveTxHash,
      })
    }

    return steps
  }

  const getProgressStatus = () => {
    if (step === 'approving') {
      return approveTxHash
        ? { state: 'pending' as const, title: 'Approve USDC', message: 'Approving USDC for Seaport' }
        : { state: 'wallet' as const, title: 'Approve USDC', message: 'Please confirm the approval in your wallet' }
    }

    if (step === 'processing' && txHash) {
      return { state: 'pending' as const, title: 'Processing Transaction', message: 'Transaction submitted' }
    }

    return {
      state: 'wallet' as const,
      title: 'Confirm in Wallet',
      message: 'Please confirm the transaction in your wallet',
    }
  }

  const openEditRecords = () => {
    if (!nameMetadata || !domain?.name) return
    dispatch(setEditRecordsModalName(domain.name))
    dispatch(setEditRecordsModalVersion(domain.version))
    dispatch(setEditRecordsModalMetadata(nameMetadata))
    dispatch(setEditRecordsModalOpen(true))
  }

  const getModalContent = () => {
    switch (step) {
      case 'review':
        return (
          <>
            <DetailList
              rows={[
                {
                  key: 'price',
                  label: 'Total Price',
                  value: (
                    <Price
                      price={listing.price}
                      currencyAddress={listing.currency_address}
                      fontSize='text-lg font-semibold'
                      iconSize='14px'
                      alignTooltip='right'
                    />
                  ),
                },
                ...(gasLabel ? [{ key: 'gas', label: 'Estimated Gas', value: gasLabel }] : []),
              ]}
            />

            {isOrderUnavailable && (
              <Notice tone={isOrderDataLoading && !isCompromiseBlocked ? 'info' : 'danger'}>
                {isCompromiseBlocked
                  ? COMPROMISED_LISTING_TOOLTIP
                  : isOrderDataLoading
                    ? 'Loading order…'
                    : domain.compromised && !isAuthenticated
                      ? 'Sign in with the original owner wallet to buy this name back.'
                      : 'This listing is not available.'}
              </Notice>
            )}

            {!isOrderUnavailable && <RevokeApprovalsNotice approvalCheck={approvalCheck} />}

            {needsApproval && (
              <Notice tone='info'>
                You need to approve USDC spending before purchasing. This is a one-time approval.
              </Notice>
            )}

            {showInsufficientBalance && (
              <Notice tone='danger' title='Insufficient balance'>
                You need{' '}
                {isETHListing
                  ? `${(Number((BigInt(listing.price) + (gasEstimate || BigInt(0)) * (gasPrice || BigInt(0))) / BigInt(10 ** 16)) / 100).toString()} ETH`
                  : `${(Number(listing.price) / Math.pow(10, TOKEN_DECIMALS.USDC)).toFixed(2)} USDC`}{' '}
                to complete this purchase.
              </Notice>
            )}
          </>
        )

      case 'approving':
      case 'confirming':
      case 'processing':
        return (
          <>
            <TxStatus {...getProgressStatus()} />
            <TxSteps steps={getPurchaseSteps()} />
          </>
        )

      case 'success':
        if (showPoapClaim) return <ClaimPoap />

        return (
          <>
            <TxStatus state='success' title='Purchase Successful' message={`${ensName} is now in your wallet.`}>
              {txHash && <TxLink hash={txHash} label='Etherscan' />}
            </TxStatus>
            {canEditRecords && (
              <button
                type='button'
                onClick={openEditRecords}
                className='text-primary hover:bg-secondary mx-auto flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-lg font-bold transition-colors'
              >
                Edit roles records
                <Image src={PencilIcon} alt='' width={18} height={18} />
              </button>
            )}
          </>
        )

      case 'error':
        return (
          <>
            <TxStatus state='error' title='Transaction Failed' message='Review the details below and try again.' />
            <Notice tone='danger' details={errorDetails}>
              {error || 'An unknown error occurred'}
            </Notice>
          </>
        )
    }
  }

  const getFooter = () => {
    switch (step) {
      case 'review':
        return (
          <>
            <PrimaryButton
              onClick={needsApproval ? handleApprove : handlePurchase}
              className={modalPrimaryActionClassName}
              disabled={(!hasSufficientBalance && !needsApproval) || isOrderUnavailable || approvalCheck.blocksTrading}
            >
              {!hasSufficientBalance && !needsApproval
                ? `Insufficient ${isETHListing ? 'ETH' : 'USDC'} Balance`
                : needsApproval
                  ? 'Approve USDC'
                  : 'Confirm Purchase'}
            </PrimaryButton>
            <SecondaryButton onClick={onClose} className={modalActionClassName}>
              Close
            </SecondaryButton>
          </>
        )

      case 'success':
        if (showPoapClaim) return null

        return (
          <SecondaryButton onClick={onClose} className={modalActionClassName}>
            Close
          </SecondaryButton>
        )

      case 'error':
        return (
          <>
            <PrimaryButton onClick={() => setStep('review')} className={modalPrimaryActionClassName}>
              Try Again
            </PrimaryButton>
            <SecondaryButton onClick={onClose} className={modalActionClassName}>
              Close
            </SecondaryButton>
          </>
        )

      default:
        return null
    }
  }

  return (
    <ModalShell
      title={showPoapClaim ? undefined : 'Purchase Name'}
      onClose={onClose}
      locked={isBusy}
      dismissible={step === 'review' || step === 'error'}
      stageKey={isBusy ? 'progress' : showPoapClaim ? 'poap' : step}
      subject={
        showPoapClaim ? null : (
          <AssetSummary
            name={ensName}
            compact={isBusy}
            meta={step !== 'success' && listingSource ? `Listed on ${listingSource}` : undefined}
            image={
              domain.name ? (
                <NameImage
                  name={domain.name}
                  tokenId={domain.token_id}
                  version={domain.version}
                  expiryDate={domain.expiry_date}
                  registrationStatus={domain.registration_status}
                  className='h-full w-full'
                  height={48}
                  width={48}
                />
              ) : undefined
            }
            price={
              <Price
                price={listing.price}
                currencyAddress={listing.currency_address}
                fontSize='text-xl font-bold'
                iconSize='16px'
                alignTooltip='right'
              />
            }
          />
        )
      }
      footer={getFooter()}
      footerHint={isBusy ? 'Keep this window open until the transaction confirms.' : undefined}
    >
      {getModalContent()}
    </ModalShell>
  )
}

export default BuyNowModal
