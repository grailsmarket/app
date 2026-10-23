'use client'

import { useState, useEffect, useMemo } from 'react'
import { SeaportOrderBuilder } from '@/lib/seaport/orderBuilder'
import { useAccount, usePublicClient } from 'wagmi'
import { useGetWalletClient } from '@/hooks/useGetWalletClient'
import { waitForTransaction } from '@/utils/web3/safeTransaction'
import { refreshEnsQueries } from '@/utils/refreshEnsQueries'
import { SEAPORT_ABI } from '@/lib/seaport/abi'
import { estimateGasWithFallback, withGasBuffer, FILL_GAS_FALLBACK_ERC20 } from '@/lib/seaport/gas'
import Price from '@/components/ui/price'
import { DomainOfferType } from '@/types/domains'
import SecondaryButton from '@/components/ui/buttons/secondary'
import PrimaryButton from '@/components/ui/buttons/primary'
import { fetchAccount, truncateAddress } from 'ethereum-identity-kit'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import User from '@/components/ui/user'
import { acceptOffer as acceptOfferApi } from '@/api/offers/accept'
import { activeChain } from '@/constants/web3/chain'
import { ensureChain } from '@/utils/web3/ensureChain'
import { AcceptOfferDomain } from '@/state/reducers/modals/acceptOfferModal'
import ClaimPoap from '../poap/claimPoap'
import { useAppSelector } from '@/state/hooks'
import { selectUserProfile } from '@/state/reducers/portfolio/profile'
import { checkIfWrapped } from '@/api/domains/checkIfWrapped'
import { beautifyName } from '@/lib/ens'
import { NAME_WRAPPER_ABI } from '@/constants/web3/abi/NameWrapper'
import { NFT_ABI } from '@/constants/web3/abi/NFTAbi'
import { ETH_REGISTRY_ABI } from '@/constants/web3/abi/ETHRegistry'
import { checkEnsV2Transferable, isEnsV2Name } from '@/lib/seaport/ensv2'
import { TOKENS } from '@/constants/web3/tokens'
import useETHPrice from '@/hooks/useETHPrice'
import { cn } from '@/utils/tailwind'
import { BigNumber } from '@ethersproject/bignumber'
import { formatPrice } from '@/utils/formatPrice'
import { AssetType } from '@/types/assets'
import { track } from '@/lib/analytics'
import { config } from '@/lib/config'
import { accountQueryKey } from '@/utils/queryKeys'
import ModalShell, { modalActionClassName, modalPrimaryActionClassName } from '@/components/ui/modal/modalShell'
import { MARKETPLACE_NAMES, getErrorParts } from '../listing/seaport-progress'
import {
  BusyView,
  CloseFooter,
  ErrorView,
  NameSubject,
  RetryFooter,
  SuccessView,
  getBusyHint,
} from '../listing/seaport-views'
import { getAcceptOfferBusyScreen, type AcceptOfferStep } from './offer-screens'

interface AcceptOfferModalProps {
  offer: DomainOfferType | null
  domain: AcceptOfferDomain | null
  onClose: () => void
}

type TransactionStep = AcceptOfferStep

const AcceptOfferModal: React.FC<AcceptOfferModalProps> = ({ offer, domain, onClose }) => {
  const { address } = useAccount()
  const queryClient = useQueryClient()
  const publicClient = usePublicClient({ chainId: activeChain.id })
  const getWalletClient = useGetWalletClient()
  const { poapClaimed } = useAppSelector(selectUserProfile)
  const [step, setStep] = useState<TransactionStep>('review')
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null)
  const [gasPrice, setGasPrice] = useState<bigint | null>(null)
  const [needsApproval, setNeedsApproval] = useState(false)
  const [approveTxHash, setApproveTxHash] = useState<string | null>(null)

  const orderBuilder = new SeaportOrderBuilder()

  // The buyer's name for the subject; shares its cache with the User chip on the review
  const { data: buyerAccount } = useQuery({
    queryKey: accountQueryKey(offer?.buyer_address),
    queryFn: async () => {
      if (!offer?.buyer_address) return null
      return await fetchAccount(offer.buyer_address)
    },
    enabled: !!offer?.buyer_address,
  })

  useEffect(() => {
    // Estimate gas and check approval when modal opens
    if (offer && domain) {
      estimateGas()
      checkApproval()
    }
  }, [offer, domain])

  if (!offer || !domain) return null

  const ensName = beautifyName(domain.name)
  // ENSv2 names are ERC1155 tokens on the ETHRegistry
  const isV2 = isEnsV2Name(offer)

  const showError = (err: unknown, fallback: string) => {
    const { message, details } = getErrorParts(err, fallback)
    setError(message)
    setErrorDetails(details)
    setStep('error')
  }

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
          address: config.seaportAddress,
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

        setGasEstimate(withGasBuffer(estimatedGas))
      } catch (estimateError) {
        // Usually means the NFT approval isn't in place yet; handleAcceptOffer re-estimates before sending
        console.warn('Failed to estimate gas, using fallback:', estimateError)
        setGasEstimate(FILL_GAS_FALLBACK_ERC20)
      }
    } catch (err) {
      console.error('Failed to estimate gas:', err)
      setGasEstimate(FILL_GAS_FALLBACK_ERC20)
    }
  }

  const checkApproval = async () => {
    try {
      if (!address || !publicClient || !domain) return

      // Determine which NFT contract to check based on if the name is wrapped
      const isWrapped = isV2 ? false : await checkIfWrapped(ensName)
      const nftContract = isV2 ? config.ensV2Registry : isWrapped ? config.ensNameWrapper : config.ensRegistrar

      console.log('Parameters:', offer)
      // Read the conduitKey from the normalized order rather than the raw order_data.
      // Grails offers nest under `protocol_data`, but Vision offers store the bare
      // `{ parameters, signature }` shape; parseStoredOrder handles both and defaults
      // a missing conduitKey to zero (which routes to the Seaport contract below).
      const parsedOrder = orderBuilder.parseStoredOrder(offer)
      const conduitKey =
        parsedOrder?.parameters.conduitKey ?? '0x0000000000000000000000000000000000000000000000000000000000000000'
      const conduitAddress =
        conduitKey === config.openseaConduitKey
          ? config.openseaConduitAddress
          : conduitKey === config.conduitKey
            ? config.conduitAddress
            : config.seaportAddress

      // console.log('Conduit address:', conduitAddress)

      // Check if Seaport is approved to transfer the NFT
      const isApproved = await publicClient.readContract({
        address: nftContract as `0x${string}`,
        abi: isV2 ? ETH_REGISTRY_ABI : isWrapped ? NAME_WRAPPER_ABI : NFT_ABI,
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
      setErrorDetails(null)
      setApproveTxHash(null)
      setStep('approving')

      if (!address || !publicClient || !domain) {
        throw new Error('Wallet not connected')
      }

      const walletClient = await getWalletClient()

      // Determine which NFT contract to approve based on if the name is wrapped
      const isWrapped = isV2 ? false : await checkIfWrapped(ensName)
      const nftContract = isV2 ? config.ensV2Registry : isWrapped ? config.ensNameWrapper : config.ensRegistrar
      // Read the conduitKey from the normalized order rather than the raw order_data.
      // Grails offers nest under `protocol_data`, but Vision offers store the bare
      // `{ parameters, signature }` shape; parseStoredOrder handles both and defaults
      // a missing conduitKey to zero (which routes to the Seaport contract below).
      const parsedOrder = orderBuilder.parseStoredOrder(offer)
      const conduitKey =
        parsedOrder?.parameters.conduitKey ?? '0x0000000000000000000000000000000000000000000000000000000000000000'
      const conduitAddress =
        conduitKey === config.openseaConduitKey
          ? config.openseaConduitAddress
          : conduitKey === config.conduitKey
            ? config.conduitAddress
            : config.seaportAddress

      console.log('Conduit key:', conduitKey)
      console.log('Conduit address:', conduitAddress)
      console.log('NFT contract:', nftContract)
      console.log('Is wrapped:', isWrapped)
      console.log('Function name:', 'setApprovalForAll')
      console.log('Args:', [conduitAddress, true])

      // Ensure we're on the ENS chain before approving
      await ensureChain(walletClient, activeChain.id)

      // Approve Seaport to transfer the NFT
      const approveTx = await walletClient.writeContract({
        address: nftContract as `0x${string}`,
        abi: isV2 ? ETH_REGISTRY_ABI : isWrapped ? NAME_WRAPPER_ABI : NFT_ABI,
        functionName: 'setApprovalForAll',
        args: [conduitAddress, true],
        chain: activeChain,
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
      showError(err, 'Approval failed')
    }
  }

  const handleAcceptOffer = async () => {
    try {
      setError(null)
      setErrorDetails(null)
      setTxHash(null)
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

      // ENSv2 names: the offer must be for the name's current token ID, and the registry must
      // allow the sale (otherwise the transaction reverts)
      if (isV2) {
        const nftItem = order.parameters.consideration.find(
          (item) => item.token.toLowerCase() === config.ensV2Registry.toLowerCase()
        )
        if (!nftItem) {
          throw new Error('This offer is not for an ENSv2 name')
        }
        const [check] = await checkEnsV2Transferable(
          publicClient,
          [{ name: ensName, tokenId: nftItem.identifierOrCriteria.toString() }],
          address
        )
        if (check.tokenId.toString() !== BigInt(nftItem.identifierOrCriteria).toString()) {
          throw new Error(
            "This offer can't be accepted: it was made before the name's roles changed, which gave it a new token ID"
          )
        }
        if (!check.ok) {
          throw new Error(check.message)
        }
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
          address: config.seaportAddress,
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

      // Re-estimate now that any NFT approval has landed; the estimate from when the
      // modal opened may have failed and fallen back to a fixed limit.
      const gas = await estimateGasWithFallback(
        () =>
          publicClient.estimateContractGas({
            address: config.seaportAddress,
            abi: SEAPORT_ABI,
            functionName: 'fulfillAdvancedOrder',
            args: [advancedOrder, [], fulfillerConduitKey, address],
            value: BigInt(0),
            account: address,
          }),
        FILL_GAS_FALLBACK_ERC20
      )

      setStep('processing')

      // Ensure we're on the ENS chain before executing the transaction
      await ensureChain(walletClient, activeChain.id)

      // Execute the transaction
      const tx = await walletClient.writeContract({
        address: config.seaportAddress,
        abi: SEAPORT_ABI,
        functionName: 'fulfillAdvancedOrder',
        args: [
          advancedOrder,
          [], // criteriaResolvers
          fulfillerConduitKey,
          address, // recipient
        ],
        value: BigInt(0),
        gas,
        chain: activeChain,
      })

      setTxHash(tx)

      // Wait for confirmation
      const receipt = await waitForTransaction(publicClient, tx)

      if (receipt.status === 'success') {
        // Mark the offer accepted for instant UI feedback. This is best-effort: the
        // on-chain fill already succeeded, and the indexer authoritatively marks the
        // offer accepted when it processes the OrderFulfilled event. A failure here
        // (e.g. ownership already transferred) must NOT surface as a failed transaction.
        try {
          await acceptOfferApi(offer.id)
        } catch (bookkeepingError) {
          console.warn('Post-accept bookkeeping failed; indexer will reconcile:', bookkeepingError)
        }

        setStep('success')
        track('offer_accepted', {
          name: domain?.name,
          offer_id: offer.id,
          source: offer.source ?? null,
          currency_address: offer.currency_address ?? null,
          amount_wei: offer.offer_amount_wei ?? null,
          tx_hash: tx,
        })
        refreshEnsQueries(queryClient, receipt)

        // TODO: Call API to update offer status
        // await updateOfferStatus(offer.id, 'accepted')
      } else {
        throw new Error('Transaction failed')
      }
    } catch (err: any) {
      console.error('Accept offer failed:', err)
      showError(err, 'Transaction failed')
    }
  }

  const isBusy = step === 'approving' || step === 'confirming' || step === 'processing'
  const showPoapClaim = step === 'success' && config.canClaimPoap && !poapClaimed
  const currencySymbol = TOKENS[offer.currency_address as keyof typeof TOKENS] as AssetType
  const buyerLabel = buyerAccount?.ens?.name
    ? beautifyName(buyerAccount.ens.name)
    : truncateAddress(offer.buyer_address)
  const sourceLabel = MARKETPLACE_NAMES[offer.source as keyof typeof MARKETPLACE_NAMES] ?? offer.source
  const busyScreen = isBusy ? getAcceptOfferBusyScreen({ step, needsApproval, approveTxHash, txHash }) : null

  const renderReview = () => (
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
    </>
  )

  const getModalContent = () => {
    if (busyScreen) return <BusyView screen={busyScreen} />

    switch (step) {
      case 'success':
        if (showPoapClaim) return <ClaimPoap />

        return (
          <SuccessView
            title='Offer Accepted'
            message={`You sold ${ensName} for ${formatPrice(offer.offer_amount_wei, currencySymbol)} ${currencySymbol}.`}
            links={txHash ? [{ key: 'sale', label: 'View on Etherscan', hash: txHash }] : undefined}
          />
        )

      case 'error':
        return <ErrorView title='Transaction Failed' error={error} details={errorDetails} />

      default:
        return renderReview()
    }
  }

  const getFooter = () => {
    switch (step) {
      case 'review':
        return (
          <>
            <PrimaryButton
              onClick={needsApproval ? handleApprove : handleAcceptOffer}
              className={modalPrimaryActionClassName}
              // disabled={isCorrectChain ? needsApproval : false}
            >
              {needsApproval ? 'Approve NFT Transfer' : 'Accept Offer'}
            </PrimaryButton>
            <SecondaryButton onClick={onClose} className={modalActionClassName}>
              Close
            </SecondaryButton>
          </>
        )

      case 'success':
        return showPoapClaim ? null : <CloseFooter onClose={onClose} />

      case 'error':
        return <RetryFooter onRetry={() => setStep('review')} onClose={onClose} />

      default:
        return null
    }
  }

  return (
    <ModalShell
      title={showPoapClaim ? undefined : 'Accept Offer'}
      onClose={onClose}
      locked={isBusy}
      // As today: the scrim closes the review and the error
      dismissible={step === 'review' || step === 'error'}
      stageKey={isBusy ? 'progress' : showPoapClaim ? 'poap' : step}
      subject={
        showPoapClaim || step === 'review' ? null : (
          <NameSubject
            names={[{ name: domain.name, tokenId: domain.tokenId, version: offer.version }]}
            compact={isBusy || step === 'error'}
            meta={step === 'success' ? `Sold to ${buyerLabel}` : `Offer from ${buyerLabel} · ${sourceLabel}`}
            price={
              <Price
                price={offer.offer_amount_wei}
                currencyAddress={offer.currency_address}
                fontSize='text-xl font-bold'
                iconSize='16px'
                alignTooltip='right'
              />
            }
          />
        )
      }
      footer={getFooter()}
      footerHint={busyScreen ? getBusyHint(busyScreen) : undefined}
    >
      {getModalContent()}
    </ModalShell>
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
