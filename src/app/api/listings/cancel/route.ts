import { API_URL } from '@/constants/api'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { listingIds, canceller, onChainCancellation } = body

    if (!listingIds || !Array.isArray(listingIds) || listingIds.length === 0) {
      return NextResponse.json({ error: 'Invalid listing IDs' }, { status: 400 })
    }

    if (!canceller) {
      return NextResponse.json({ error: 'Canceller address is required' }, { status: 400 })
    }

    // If this is just marking as cancelled after on-chain cancellation, skip fetching
    if (onChainCancellation) {
      const promises = listingIds.map(async (listingId: number) => {
        const response = await fetch(`${API_URL}/listings/${listingId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(`Failed to cancel listing ${listingId}:`, await response.text())
          return { listingId, success: false }
        }

        return { listingId, success: true }
      })

      const results = await Promise.all(promises)
      const failed = results.filter((r) => !r.success)

      if (failed.length > 0) {
        return NextResponse.json({ error: 'Some listings failed to update', failed }, { status: 207 })
      }

      return NextResponse.json({
        message: 'All listings cancelled successfully',
        listingIds,
      })
    }

    // Fetch listing details to get order data for on-chain cancellation
    const listingDetailsPromises = listingIds.map(async (listingId: number) => {
      const response = await fetch(`${API_URL}/listings/${listingId}`)
      if (response.ok) {
        const data = await response.json()
        return data.data
      }
      return null
    })

    const listings = await Promise.all(listingDetailsPromises)

    // Separate Grails and OpenSea listings
    const grailsListingIds: number[] = []
    const openSeaOrdersToCancel: any[] = []

    listings.forEach((listing, index) => {
      if (!listing) {
        console.error(`Failed to fetch listing ${listingIds[index]}`)
        return
      }

      const source = listing.source || 'grails'

      if (source === 'grails') {
        // Grails listings can be cancelled directly in the database
        grailsListingIds.push(listingIds[index])
      } else if (source === 'opensea') {
        // OpenSea listings require on-chain cancellation
        const orderData = typeof listing.order_data === 'string' ? JSON.parse(listing.order_data) : listing.order_data

        const parameters = orderData.protocol_data?.parameters || orderData.parameters

        if (!parameters) {
          console.error(`No order parameters found for listing ${listingIds[index]}`)
          return
        }

        openSeaOrdersToCancel.push({
          listingId: listingIds[index],
          source,
          orderComponents: {
            offerer: parameters.offerer,
            zone: parameters.zone,
            offer: parameters.offer,
            consideration: parameters.consideration,
            orderType: parameters.orderType,
            startTime: parameters.startTime,
            endTime: parameters.endTime,
            zoneHash: parameters.zoneHash,
            salt: parameters.salt,
            conduitKey: parameters.conduitKey,
            counter: parameters.counter,
          },
        })
      }
    })

    // Cancel Grails listings directly in database
    if (grailsListingIds.length > 0) {
      const cancelPromises = grailsListingIds.map(async (listingId: number) => {
        const response = await fetch(`${API_URL}/listings/${listingId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(`Failed to cancel listing ${listingId}:`, await response.text())
          return { listingId, success: false }
        }

        return { listingId, success: true }
      })

      await Promise.all(cancelPromises)
    }

    // If there are OpenSea listings, return them for on-chain cancellation
    if (openSeaOrdersToCancel.length > 0) {
      return NextResponse.json({
        requiresOnChainCancellation: true,
        orders: openSeaOrdersToCancel,
        grailsListingsCancelled: grailsListingIds,
      })
    }

    // All listings were Grails listings and have been cancelled
    return NextResponse.json({
      requiresOnChainCancellation: false,
      message: 'All Grails listings cancelled successfully',
      listingIds: grailsListingIds,
    })
  } catch (error: any) {
    console.error('Error cancelling orders:', error)
    return NextResponse.json({ error: error.message || 'Failed to cancel orders' }, { status: 500 })
  }
}
