import { useEffect, useState, useCallback } from 'react'
import { useWalletClient, usePublicClient } from 'wagmi'
import { seaportClient } from '@/lib/seaport/seaportClient'
import { OrderWithCounter } from '@opensea/seaport-js/lib/types'
import { createOffer as createOfferApi, submitOfferToOpenSea } from '@/api/offers/create'
import { useQueryClient } from '@tanstack/react-query'
import { cancelOffer as cancelOfferApi } from '@/api/offers/cancel'
import { useUserContext } from '@/context/user'
import { DomainOfferType, MarketplaceDomainType } from '@/types/domains'
import { ListingStatus } from '@/components/modal/listing/createListingModal'
import { MarketplaceType } from '@/lib/seaport/seaportClient'

export function useSeaportClient() {
  const queryClient = useQueryClient()
  const { userAddress: address, authStatus } = useUserContext()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Seaport client when wallet connects
  useEffect(() => {
    const initializeSeaport = async () => {
      if (!publicClient) {
        console.log('Skipping Seaport init - no publicClient')
        return
      }

      if (!walletClient || !address) {
        console.log('Skipping Seaport init - no walletClient')
        return
      }

      try {
        console.log('Initializing Seaport...', {
          hasPublicClient: !!publicClient,
          hasWalletClient: !!walletClient,
          authStatus,
        })
        // Pass viem clients directly
        await seaportClient.initialize(publicClient, walletClient)
        setIsInitialized(true)
        console.log('Seaport initialized successfully')
      } catch (err) {
        console.error('Failed to initialize Seaport:', err)
        setError('Failed to initialize Seaport client')
        setIsInitialized(false)
      }
    }

    initializeSeaport()
  }, [publicClient, walletClient, address, authStatus])

  const refetchListingQueries = useCallback(() => {
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['profile', 'domains'] })
      queryClient.refetchQueries({ queryKey: ['name', 'details'] })
    }, 1000)
  }, [queryClient])

  const refetchOfferQueries = useCallback(() => {
    // Timeout to ensure DB is fully updated (does not work without timeout)
    setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['name', 'offers'] })
      queryClient.refetchQueries({ queryKey: ['sent_offers'] })
      queryClient.refetchQueries({ queryKey: ['received_offers'] })
    }, 1000)
  }, [queryClient])

  // Create a listing
  const createListing = useCallback(
    async (params: {
      domains: MarketplaceDomainType[]
      prices: string[]
      expiryDate: number
      royaltyBps?: number
      royaltyRecipient?: string
      marketplace: MarketplaceType[]
      currencies?: ('ETH' | 'USDC')[]
      brokerAddress?: string // Address to receive broker fee
      brokerFeeBps?: number // Broker fee in basis points (e.g., 100 = 1%)
      setStatus?: (status: ListingStatus) => void
      setApproveTxHash?: (txHash: string | null) => void
      setCreateListingTxHash?: (txHash: string | null) => void
      setError?: (error: string | null) => void
    }): Promise<{ success: boolean; error?: string; result?: any }> => {
      if (!address) {
        return { success: false, error: 'Wallet not connected' }
      }

      // Ensure wallet client and public client are available
      if (!walletClient || !publicClient) {
        return { success: false, error: 'Wallet client not available. Please ensure your wallet is connected.' }
      }

      if (!isInitialized) {
        // We attempt to initialize the seaport client again
        const seaport = await seaportClient.initialize(publicClient, walletClient)

        // If the seaport client is not initialized, we return an error
        if (!seaport) {
          params.setError?.('Wallet not connected or Seaport not initialized')
          return { success: false, error: 'Wallet not connected or Seaport not initialized' }
        }
      }

      setIsLoading(true)
      setError(null)

      try {
        await seaportClient.initialize(publicClient, walletClient)

        const orders = await seaportClient.createListingOrder({
          ...params,
          offererAddress: address,
          marketplace: params.marketplace,
          currencies: params.currencies,
          setStatus: params.setStatus,
          setApproveTxHash: params.setApproveTxHash,
          setCreateListingTxHash: params.setCreateListingTxHash,
          setError: params.setError,
        })

        // console.log('Orders:', orders)

        // console.log('Params:', params)
        // console.log('Marketplace:', params.marketplace)
        // console.log('Currency:', params.currency)
        // console.log('Offerer Address:', address)
        // console.log('Order:', order)

        // Submitting created orders to the marketplace APIs
        // params.setStatus?.('submitting')
        // Handle "both" marketplace case
        if (params.marketplace.length > 1 && 'opensea' in orders && 'grails' in orders) {
          // Create two separate listings - one for each platform
          const openSeaOrders = seaportClient.formatOrderForStorage(orders.opensea)
          openSeaOrders.forEach((order) => {
            order.marketplace = 'opensea'
          })

          const grailsOrders = seaportClient.formatOrderForStorage(orders.grails)
          grailsOrders.forEach((order) => {
            order.marketplace = 'grails'
          })

          // Determine if Grails listing should be brokered
          const isBrokeredListing = params.brokerAddress && params.brokerFeeBps

          // Submit OpenSea order (always uses regular endpoint)
          const openSeaResponsePromise = fetch('/api/listings/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'listing',
              domains: params.domains,
              prices: params.prices,
              currencies: params.currencies,
              orders: openSeaOrders,
              seller_address: address,
            }),
          })

          // Submit Grails order (use brokered-listings if broker specified)
          let grailsResponsePromise: Promise<Response>

          if (isBrokeredListing) {
            // Use brokered-listings endpoint for each domain
            grailsResponsePromise = (async () => {
              const responses = await Promise.all(
                params.domains.map(async (domain, index) => {
                  const order = grailsOrders[index]
                  const priceWei = BigInt(Math.floor(parseFloat(params.prices[index]) * 1e18)).toString()
                  const currency = params.currencies?.[index] || 'ETH'
                  const currencyAddress = currency === 'USDC'
                    ? '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
                    : '0x0000000000000000000000000000000000000000'

                  return fetch('/api/brokered-listings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      token_id: domain.token_id,
                      price_wei: priceWei,
                      currency_address: currencyAddress,
                      order_data: JSON.stringify(order),
                      order_hash: order.orderHash,
                      seller_address: address,
                      broker_address: params.brokerAddress,
                      broker_fee_bps: params.brokerFeeBps,
                      expires_at: new Date(params.expiryDate * 1000).toISOString(),
                    }),
                  })
                })
              )

              // Return a synthetic response that matches the expected format
              const allOk = responses.every(r => r.ok)
              if (!allOk) {
                const failedResponse = responses.find(r => !r.ok)!
                return failedResponse
              }

              // Create a synthetic successful response
              const results = await Promise.all(responses.map(r => r.json()))
              return new Response(JSON.stringify({ success: true, data: results }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              })
            })()
          } else {
            grailsResponsePromise = fetch('/api/listings/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'listing',
                domains: params.domains,
                prices: params.prices,
                currencies: params.currencies,
                orders: grailsOrders,
                seller_address: address,
              }),
            })
          }

          const [openSeaResponse, grailsResponse] = await Promise.all([
            openSeaResponsePromise,
            grailsResponsePromise,
          ])

          if (!openSeaResponse.ok || !grailsResponse.ok) {
            const errors = []
            if (!openSeaResponse.ok) {
              const osError = await openSeaResponse.json()
              errors.push('OpenSea: ' + (osError.error || 'Unknown error'))
            }
            if (!grailsResponse.ok) {
              const grailsError = await grailsResponse.json()
              errors.push('Grails: ' + (grailsError.error || 'Unknown error'))
            }

            params.setError?.('Failed to save orders: ' + errors.join(', '))
            throw new Error('Failed to save orders: ' + errors.join(', '))
          }

          const [openSeaResult, grailsResult] = await Promise.all([openSeaResponse.json(), grailsResponse.json()])

          // Check for warnings in either result
          const warnings = []
          if (openSeaResult.warning) warnings.push(openSeaResult.warning)
          if (grailsResult.warning) warnings.push(grailsResult.warning)
          if (warnings.length > 0) {
            console.warn('Listing warnings:', warnings)
            setError(warnings.join(' | '))
            params.setError?.(warnings.join(' | '))
          }

          return { success: true, result: { openSea: openSeaResult, grails: grailsResult } }
        }

        // Single marketplace case
        const formattedOrders = seaportClient.formatOrderForStorage(orders as OrderWithCounter[])

        // Determine if this is a brokered listing (broker specified + Grails marketplace)
        const isBrokeredListing = params.brokerAddress && params.brokerFeeBps && params.marketplace.includes('grails')

        // Send to appropriate API endpoint
        let response: Response

        if (isBrokeredListing) {
          // Use brokered-listings endpoint for each domain
          // Note: brokered-listings endpoint handles one listing at a time
          const responses = await Promise.all(
            params.domains.map(async (domain, index) => {
              const order = formattedOrders[index]
              const priceWei = BigInt(Math.floor(parseFloat(params.prices[index]) * 1e18)).toString()
              const currency = params.currencies?.[index] || 'ETH'
              const currencyAddress = currency === 'USDC'
                ? '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' // USDC address
                : '0x0000000000000000000000000000000000000000' // ETH

              return fetch('/api/brokered-listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  token_id: domain.token_id,
                  price_wei: priceWei,
                  currency_address: currencyAddress,
                  order_data: JSON.stringify(order),
                  order_hash: order.orderHash,
                  seller_address: address,
                  broker_address: params.brokerAddress,
                  broker_fee_bps: params.brokerFeeBps,
                  expires_at: new Date(params.expiryDate * 1000).toISOString(),
                }),
              })
            })
          )

          // Check if any failed
          const failedResponses = responses.filter(r => !r.ok)
          if (failedResponses.length > 0) {
            const errorData = await failedResponses[0].json()
            throw new Error(errorData.error?.message || errorData.error || 'Failed to create brokered listing')
          }

          // Return combined results
          const results = await Promise.all(responses.map(r => r.json()))
          return { success: true, result: results }
        }

        // Regular listing - use existing endpoint
        response = await fetch('/api/listings/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'listing',
            domains: params.domains,
            prices: params.prices,
            currencies: params.currencies,
            orders: formattedOrders,
            seller_address: address,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save order to database')
        }

        const result = await response.json()

        // Check for OpenSea submission warnings
        if (result.warning) {
          console.warn('OpenSea submission warning:', result.warning)
          // Set error to show warning to user
          setError(result.warning)
          return { success: false, error: result.warning }
        }

        return { success: true, result }
      } catch (err: any) {
        setError(err.message || 'Failed to create listing')
        return { success: false, error: err.message || 'Failed to create listing' }
      } finally {
        console.log('Refetching listing queries')
        setIsLoading(false)
        refetchListingQueries()
      }
    },
    [isInitialized, address, refetchListingQueries, walletClient, publicClient]
  )

  // Create an offer
  const createOffer = useCallback(
    async (params: {
      tokenId: string
      ensName: string
      ensNameId: number
      price: number
      currency: 'WETH' | 'USDC'
      expiryDate: number
      currentOwner?: string
      marketplace: MarketplaceType[]
    }) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Ensure wallet client and public client are available
      if (!walletClient || !publicClient) {
        throw new Error('Wallet client not available. Please ensure your wallet is connected.')
      }

      if (!isInitialized) {
        // We attempt to initialize the seaport client again
        const seaport = await seaportClient.initialize(publicClient, walletClient)

        // If the seaport client is not initialized, we return an error
        if (!seaport) {
          throw new Error('Wallet not connected or Seaport not initialized')
        }
      }

      setIsLoading(true)
      setError(null)

      try {
        console.log('Seaport initialized for offer creation')

        const result = await seaportClient.createOffer({
          tokenId: params.tokenId,
          ensName: params.ensName,
          price: params.price,
          currency: params.currency,
          expiryDate: params.expiryDate,
          offererAddress: address,
          marketplace: params.marketplace,
        })

        // Handle the result - it should be a single order since we're using 'grails' marketplace
        const createdOffers = Object.entries(result).map(async ([marketplace, order]) => {
          // Here we handle submitting the offer to OpenseaAPI directly
          if (marketplace === 'opensea') {
            const openSeaResponse = await submitOfferToOpenSea(order)
            console.log('OpenSea response:', openSeaResponse)
            return {
              response: openSeaResponse,
              marketplace,
            }
          }

          // Here we handle creating the offer for the Grails marketplace
          console.log('Creating offer for marketplace:', marketplace)
          const formattedOrder = seaportClient.formatOrderForStorage([order])[0]
          const response = await createOfferApi({
            marketplace: marketplace as MarketplaceType,
            tokenId: params.tokenId,
            ensName: params.ensName,
            price: params.price,
            currency: params.currency,
            orderData: formattedOrder,
            buyerAddress: address,
            expiryDate: params.expiryDate,
            ensNameId: params.ensNameId,
          })

          return {
            response,
            marketplace,
          }
        })

        return createdOffers
      } catch (err: any) {
        setError(err.message || 'Failed to create offer')
        throw err
      } finally {
        setIsLoading(false)
        refetchOfferQueries()
      }
    },
    [address, walletClient, publicClient, refetchOfferQueries, isInitialized]
  )

  // Fulfill an order
  const fulfillOrder = useCallback(
    async (order: OrderWithCounter) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      if (!walletClient || !publicClient) {
        throw new Error('Wallet client not available. Please ensure your wallet is connected.')
      }

      if (!isInitialized) {
        // We attempt to initialize the seaport client again
        const seaport = await seaportClient.initialize(publicClient, walletClient)

        // If the seaport client is not initialized, we return an error
        if (!seaport) {
          throw new Error('Wallet not connected or Seaport not initialized')
        }
      }

      setIsLoading(true)
      setError(null)

      try {
        const transaction = await seaportClient.fulfillOrder(order, address)
        return transaction
      } catch (err: any) {
        setError(err.message || 'Failed to fulfill order')
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [isInitialized, address, walletClient, publicClient]
  )

  // Cancel orders
  const cancelListings = useCallback(
    async (listingIds: number[]) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Ensure Seaport is initialized with wallet client for signing
      if (!walletClient || !publicClient) {
        throw new Error('Wallet client not available')
      }

      if (!isInitialized) {
        // We attempt to initialize the seaport client again
        const seaport = await seaportClient.initialize(publicClient, walletClient)

        // If the seaport client is not initialized, we return an error
        if (!seaport) {
          throw new Error('Wallet not connected or Seaport not initialized')
        }
      }

      setIsLoading(true)
      setError(null)

      try {
        // Step 1: Fetch order components from API
        const fetchResponse = await fetch('/api/listings/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingIds,
            canceller: address,
          }),
        })

        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json()
          throw new Error(errorData.error || 'Failed to fetch order data')
        }

        const { requiresOnChainCancellation, orders, message } = await fetchResponse.json()

        // If no on-chain cancellation is required, Grails listings were already cancelled in the database
        if (!requiresOnChainCancellation) {
          console.log('Grails listings cancelled successfully:', message)
          return { success: true, message }
        }

        // For OpenSea listings, proceed with on-chain cancellation
        if (!orders || orders.length === 0) {
          throw new Error('No orders to cancel on-chain')
        }

        // Step 2: Cancel on-chain using Seaport contract
        const orderComponents = orders.map((o: any) => o.orderComponents)
        const transaction = await seaportClient.cancelOrders(orderComponents, address)

        console.log('Cancellation transaction:', transaction)

        // Step 3: Update database after successful on-chain cancellation
        const updateResponse = await fetch('/api/listings/cancel', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            listingIds: orders.map((o: any) => o.listingId),
            canceller: address,
            onChainCancellation: true,
          }),
        })

        if (!updateResponse.ok) {
          console.warn('Failed to update database after cancellation, but on-chain cancel succeeded')
        }

        return transaction
      } catch (err: any) {
        setError(err.message || 'Failed to cancel orders')
        throw err
      } finally {
        setIsLoading(false)
        refetchListingQueries()
      }
    },
    [address, walletClient, publicClient, refetchListingQueries, isInitialized]
  )

  const cancelOffer = useCallback(
    async (offer: DomainOfferType) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Ensure Seaport is initialized with wallet client for signing
      if (!walletClient || !publicClient) {
        throw new Error('Wallet client not available')
      }

      setIsLoading(true)
      setError(null)

      const offerId = offer.id

      if (offer.source === 'opensea') {
        console.log('Cancelling OpenSea offer:', offer)

        // Build the order component
        const onchaincancelParams = {
          offerer: offer.buyer_address,
          zone: offer.order_data.protocol_data.parameters.zone,
          orderType: offer.order_data.protocol_data.parameters.orderType,
          startTime: offer.order_data.protocol_data.parameters.startTime,
          endTime: offer.order_data.protocol_data.parameters.endTime,
          zoneHash: offer.order_data.protocol_data.parameters.zoneHash,
          salt: offer.order_data.protocol_data.parameters.salt,
          offer: offer.order_data.protocol_data.parameters.offer,
          consideration: offer.order_data.protocol_data.parameters.consideration,
          totalOriginalConsiderationItems: offer.order_data.protocol_data.parameters.totalOriginalConsiderationItems,
          conduitKey: offer.order_data.protocol_data.parameters.conduitKey,
          counter: offer.order_data.protocol_data.parameters.counter,
        }

        const openseaResponse = await seaportClient.cancelOrders([onchaincancelParams], address)
        console.log('OpenSea response:', openseaResponse)
      }

      try {
        // Re-initialize to ensure we have the wallet client
        await seaportClient.initialize(publicClient, walletClient)
        console.log('Seaport re-initialized with wallet client for cancellation')
        // Step 1: Fetch order components from API
        const response = await cancelOfferApi(offerId)
        return response
      } catch (err: any) {
        setError(err.message || 'Failed to cancel orders')
        throw err
      } finally {
        setIsLoading(false)
        refetchOfferQueries()
      }
    },
    [address, walletClient, publicClient, refetchOfferQueries]
  )

  // Validate order
  const validateOrder = useCallback(
    async (order: OrderWithCounter) => {
      if (!isInitialized) {
        throw new Error('Seaport not initialized')
      }

      try {
        const isValid = await seaportClient.validateOrder(order)
        return isValid
      } catch (err: any) {
        console.error('Order validation error:', err)
        return false
      }
    },
    [isInitialized]
  )

  // Get order status
  const getOrderStatus = useCallback(
    async (orderHash: string) => {
      if (!isInitialized) {
        throw new Error('Seaport not initialized')
      }

      try {
        const status = await seaportClient.getOrderStatus(orderHash)
        return status
      } catch (err: any) {
        console.error('Failed to get order status:', err)
        return null
      }
    },
    [isInitialized]
  )

  // Reinitialize Seaport client (useful after chain switch)
  const reinitializeSeaport = useCallback(async () => {
    if (!publicClient) {
      console.log('Cannot reinitialize - no publicClient')
      return
    }

    try {
      console.log('Reinitializing Seaport after chain switch...')
      await seaportClient.initialize(publicClient, walletClient || undefined)
      setIsInitialized(true)
      console.log('Seaport reinitialized successfully')
    } catch (err) {
      console.error('Failed to reinitialize Seaport:', err)
      setError('Failed to reinitialize Seaport client')
      setIsInitialized(false)
    }
  }, [publicClient, walletClient])

  // Get conduit configuration
  const conduitConfig = seaportClient.getConduitConfig()

  return {
    isInitialized,
    isLoading,
    error,
    createListing,
    createOffer,
    fulfillOrder,
    cancelListings,
    cancelOffer,
    validateOrder,
    getOrderStatus,
    conduitConfig,
    reinitializeSeaport,
  }
}
