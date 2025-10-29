import { useEffect, useState, useCallback } from 'react'
import { useAccount, useWalletClient, usePublicClient } from 'wagmi'
import { seaportClient } from '@/lib/seaport/seaportClient'
import { OrderWithCounter } from '@opensea/seaport-js/lib/types'
import { createOffer as createOfferApi } from '@/api/offers/create'
import { useQueryClient } from '@tanstack/react-query'
import { cancelOffer as cancelOfferApi } from '@/api/offers/cancel'

export function useSeaportClient() {
  const queryClient = useQueryClient()
  const { address, isConnected } = useAccount()
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

      if (!walletClient) {
        console.log('Skipping Seaport init - no walletClient')
        return
      }

      try {
        console.log('Initializing Seaport...', {
          hasPublicClient: !!publicClient,
          hasWalletClient: !!walletClient,
          isConnected,
        })
        // Pass viem clients directly
        await seaportClient.initialize(publicClient, walletClient || undefined)
        setIsInitialized(true)
        console.log('Seaport initialized successfully')
      } catch (err) {
        console.error('Failed to initialize Seaport:', err)
        setError('Failed to initialize Seaport client')
        setIsInitialized(false)
      }
    }

    initializeSeaport()
  }, [publicClient, walletClient, isConnected])

  const refetchListingQueries = useCallback(() => {
    queryClient.refetchQueries({ queryKey: ['portfolio', 'domains'] })
    queryClient.refetchQueries({ queryKey: ['name', 'details'] })
  }, [queryClient])

  const refetchOfferQueries = useCallback(() => {
    queryClient.refetchQueries({ queryKey: ['name', 'offers'] })
    queryClient.refetchQueries({ queryKey: ['my_offers'] })
  }, [queryClient])

  // Create a listing
  const createListing = useCallback(
    async (params: {
      tokenId: string
      priceInEth: string
      expiryDate: number
      royaltyBps?: number
      royaltyRecipient?: string
      marketplace: ('opensea' | 'grails')[]
      currency?: 'ETH' | 'USDC'
    }) => {
      if (!isInitialized || !address) {
        throw new Error('Wallet not connected or Seaport not initialized')
      }

      setIsLoading(true)
      setError(null)

      try {
        const order = await seaportClient.createListingOrder({
          ...params,
          offererAddress: address,
          marketplace: params.marketplace,
          currency: params.currency,
        })

        // Handle "both" marketplace case
        if (params.marketplace.length > 1 && 'opensea' in order && 'grails' in order) {
          // Create two separate listings - one for each platform
          const openSeaOrder = seaportClient.formatOrderForStorage(order.opensea)
          openSeaOrder.marketplace = 'opensea'

          const grailsOrder = seaportClient.formatOrderForStorage(order.grails)
          grailsOrder.marketplace = 'grails'

          // Submit both orders
          const [openSeaResponse, grailsResponse] = await Promise.all([
            fetch('/api/listings/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'listing',
                tokenId: params.tokenId,
                price: params.priceInEth,
                currency: params.currency,
                order_data: openSeaOrder,
                seller_address: address,
              }),
            }),
            fetch('/api/listings/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                type: 'listing',
                tokenId: params.tokenId,
                price: params.priceInEth,
                currency: params.currency,
                order_data: grailsOrder,
                seller_address: address,
              }),
            }),
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
          }

          return { opensea: openSeaResult, grails: grailsResult }
        }

        // Single marketplace case
        const formattedOrder = seaportClient.formatOrderForStorage(order as any)
        formattedOrder.marketplace = params.marketplace[0]

        // Send to API
        const response = await fetch('/api/listings/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'listing',
            tokenId: params.tokenId,
            price: params.priceInEth,
            currency: params.currency,
            order_data: formattedOrder,
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
        }

        return result
      } catch (err: any) {
        setError(err.message || 'Failed to create listing')
        throw err
      } finally {
        console.log('Refetching listing queries')
        setIsLoading(false)
        refetchListingQueries()
      }
    },
    [isInitialized, address, refetchListingQueries]
  )

  // Create an offer
  const createOffer = useCallback(
    async (params: {
      tokenId: string
      ensNameId: number
      price: number
      currency: 'WETH' | 'USDC'
      expiryDate: number
      currentOwner?: string
      marketplace: ('opensea' | 'grails')[]
    }) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Ensure wallet client and public client are available
      if (!walletClient || !publicClient) {
        throw new Error('Wallet client not available. Please ensure your wallet is connected.')
      }

      setIsLoading(true)
      setError(null)

      try {
        // Always initialize seaport client with wallet client before creating offer
        await seaportClient.initialize(publicClient, walletClient)
        console.log('Seaport initialized for offer creation')

        const result = await seaportClient.createOffer({
          tokenId: params.tokenId,
          price: params.price,
          currency: params.currency,
          expiryDate: params.expiryDate,
          offererAddress: address,
          marketplace: params.marketplace,
        })

        // Handle the result - it should be a single order since we're using 'grails' marketplace
        const createdOffers = Object.entries(result).map(async ([marketplace, order]) => {
          console.log('Creating offer for marketplace:', marketplace)
          console.log('Order:', order)
          const formattedOrder = seaportClient.formatOrderForStorage(order)
          const response = await createOfferApi({
            ensNameId: params.ensNameId,
            price: params.price,
            currency: params.currency,
            orderData: formattedOrder,
            buyerAddress: address,
            expiryDate: params.expiryDate,
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
    [address, walletClient, publicClient, refetchOfferQueries]
  )

  // Fulfill an order
  const fulfillOrder = useCallback(
    async (order: OrderWithCounter) => {
      if (!isInitialized || !address) {
        throw new Error('Wallet not connected or Seaport not initialized')
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
    [isInitialized, address]
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

      setIsLoading(true)
      setError(null)

      try {
        // Re-initialize to ensure we have the wallet client
        await seaportClient.initialize(publicClient, walletClient)
        console.log('Seaport re-initialized with wallet client for cancellation')
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
    [address, walletClient, publicClient, refetchListingQueries]
  )

  const cancelOffer = useCallback(
    async (offerId: number) => {
      if (!address) {
        throw new Error('Wallet not connected')
      }

      // Ensure Seaport is initialized with wallet client for signing
      if (!walletClient || !publicClient) {
        throw new Error('Wallet client not available')
      }

      setIsLoading(true)
      setError(null)

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
  }
}
