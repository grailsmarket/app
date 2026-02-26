'use client'

import { useSeaportClient } from '@/hooks/useSeaportClient'
import { OrderStatus, OrderWithCounter } from '@opensea/seaport-js/lib/types'
import React, { createContext, useContext, ReactNode } from 'react'
import { ContractTransaction } from 'ethers'
import { DomainOfferType, MarketplaceDomainType } from '@/types/domains'
import { ListingStatus } from '@/components/modal/listing/createListingModal'

type SeaportContextValue = {
  isInitialized: boolean
  reinitializeSeaport: () => Promise<void>
  cancelListings: (listingIds: number[]) => Promise<void>
  cancelOffer: (offer: DomainOfferType) => Promise<void>
  validateOrder: (order: OrderWithCounter) => Promise<boolean>
  getOrderStatus: (orderHash: string) => Promise<OrderStatus | null>
  createListing: (params: {
    domains: MarketplaceDomainType[]
    prices: string[]
    expiryDate: number
    royaltyBps?: number
    royaltyRecipient?: string
    marketplace: ('opensea' | 'grails')[]
    currencies?: ('ETH' | 'USDC')[]
    brokerAddress?: string // Address to receive broker fee
    brokerFeeBps?: number // Broker fee in basis points (e.g., 100 = 1%)
    setStatus?: (status: ListingStatus) => void
    setApproveTxHash?: (txHash: string | null) => void
    setCreateListingTxHash?: (txHash: string | null) => void
    setError?: (error: string | null) => void
  }) => Promise<{ success: boolean; error?: string; result?: any }>
  createOffer: (params: {
    tokenId: string
    ensName: string
    ensNameId: number
    price: number
    currency: 'WETH' | 'USDC'
    expiryDate: number
    currentOwner?: string
    marketplace: ('opensea' | 'grails')[]
  }) => Promise<any>
  fulfillOrder: (order: OrderWithCounter) => Promise<ContractTransaction>
  isLoading: boolean
}

const SeaportContext = createContext<SeaportContextValue | undefined>(undefined)

export const SeaportProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    isInitialized,
    reinitializeSeaport,
    cancelListings,
    cancelOffer,
    validateOrder,
    getOrderStatus,
    createListing,
    createOffer,
    fulfillOrder,
    isLoading,
  } = useSeaportClient()

  return (
    <SeaportContext.Provider
      value={{
        isInitialized,
        reinitializeSeaport,
        cancelListings,
        cancelOffer,
        validateOrder,
        getOrderStatus,
        createListing,
        createOffer,
        fulfillOrder,
        isLoading,
      }}
    >
      {children}
    </SeaportContext.Provider>
  )
}

export const useSeaportContext = (): SeaportContextValue => {
  const context = useContext(SeaportContext)
  if (!context) {
    // Default to marketplace if no context is provided (backwards compatibility)
    return {
      isInitialized: false,
      reinitializeSeaport: async () => {},
      cancelListings: async () => {},
      cancelOffer: async () => {},
      validateOrder: async () => false,
      getOrderStatus: async () => null,
      conduitConfig: null,
      createListing: async () => {
        return { success: false, error: 'Not implemented' }
      },
      createOffer: async () => {},
      // @ts-expect-error - fulfillOrder is not implemented
      fulfillOrder: async () => {},
      error: null,
      isLoading: false,
    }
  }
  return context
}
