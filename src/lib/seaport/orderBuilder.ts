import { DomainListingType, DomainOfferType } from '@/types/domains'
import { SeaportOrder, SeaportOrderParameters, AdvancedOrder, Fulfillment, ItemType } from '@/types/seaport'

export class SeaportOrderBuilder {
  /**
   * Parse stored order data from listing
   */
  parseStoredOrder(order: DomainListingType | DomainOfferType): SeaportOrder | null {
    try {
      if (!order.order_data) return null

      // The order_data might be a JSON string or an object
      const orderData = typeof order.order_data === 'string' ? JSON.parse(order.order_data) : order.order_data

      // Extract protocol_data which contains the Seaport order details
      // Handle different data structures:
      // 1. OpenSea listing object: { protocol_data: { parameters, signature }, ... }
      // 2. Grails order: { protocol_data: { parameters, signature }, ... }
      // 3. Direct protocol data: { parameters, signature }
      let protocolData

      if (orderData.protocol_data) {
        // Case 1 & 2: Has protocol_data nested
        protocolData = orderData.protocol_data
      } else if (orderData.parameters) {
        // Case 3: Direct protocol data
        protocolData = orderData
      } else {
        console.error('Unable to find protocol data in order:', orderData)
        return null
      }

      if (!protocolData.parameters) {
        console.error('No parameters found in order data:', orderData)
        return null
      }

      console.log('Protocol parameters:', protocolData.parameters)
      console.log('Offer array:', protocolData.parameters.offer)
      console.log('Consideration array:', protocolData.parameters.consideration)

      // Check if this is possibly a different format (like from the offers API)
      if (!protocolData.parameters.offer && !protocolData.parameters.consideration) {
        console.error('Order data is missing offer and consideration arrays')
        return null
      }

      // Convert string values to bigints where needed
      const parameters: SeaportOrderParameters = {
        offerer: protocolData.parameters.offerer,
        zone: protocolData.parameters.zone || '0x0000000000000000000000000000000000000000',
        orderType: Number(protocolData.parameters.orderType || 0),
        startTime: BigInt(protocolData.parameters.startTime || 0),
        endTime: BigInt(protocolData.parameters.endTime || 0),
        zoneHash:
          protocolData.parameters.zoneHash || '0x0000000000000000000000000000000000000000000000000000000000000000',
        salt: protocolData.parameters.salt,
        conduitKey:
          protocolData.parameters.conduitKey || '0x0000000000000000000000000000000000000000000000000000000000000000',
        offer: (protocolData.parameters.offer || []).map((item: any) => ({
          ...item,
          identifierOrCriteria: BigInt(item.identifierOrCriteria || item.identifier || 0),
          startAmount: BigInt(item.startAmount || 0),
          endAmount: BigInt(item.endAmount || 0),
        })),
        consideration: (protocolData.parameters.consideration || []).map((item: any) => ({
          ...item,
          identifierOrCriteria: BigInt(item.identifierOrCriteria || item.identifier || 0),
          startAmount: BigInt(item.startAmount || 0),
          endAmount: BigInt(item.endAmount || 0),
        })),
        totalOriginalConsiderationItems: Number(
          protocolData.parameters.totalOriginalConsiderationItems || protocolData.parameters.consideration?.length || 0
        ),
      }

      return {
        parameters,
        signature: protocolData.signature || '0x',
      }
    } catch (error) {
      console.error('Failed to parse stored order:', error)
      return null
    }
  }

  /**
   * Validate that an order can be fulfilled
   */
  validateOrder(order: SeaportOrder): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    const now = BigInt(Math.floor(Date.now() / 1000))

    // Check time validity
    if (order.parameters.startTime > now) {
      errors.push('Order has not started yet')
    }
    if (order.parameters.endTime < now && order.parameters.endTime !== BigInt(0)) {
      errors.push('Order has expired')
    }

    // Check basic structure
    if (!order.parameters.offer || order.parameters.offer.length === 0) {
      errors.push('Order has no offer items')
    }
    if (!order.parameters.consideration || order.parameters.consideration.length === 0) {
      errors.push('Order has no consideration items')
    }

    // Check signature
    if (!order.signature || order.signature === '0x') {
      errors.push('Order is not signed')
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Build BasicOrderParameters for efficient fulfillment (Seaport 1.6)
   */
  buildBasicOrderParameters(order: SeaportOrder, fulfillerAddress: `0x${string}`) {
    const parameters = order.parameters

    // Get the NFT being offered (first offer item)
    const offerItem = parameters.offer[0]

    // Get payment considerations (filter out fee recipients)
    const considerations = parameters.consideration
    const primaryConsideration = considerations[0] // Payment to seller
    const additionalRecipients = considerations.slice(1).map((c) => ({
      amount: c.startAmount,
      recipient: c.recipient as `0x${string}`,
    }))

    // Determine basic order type based on offer and consideration
    // 0 = ETH_TO_ERC721 (most common for NFT purchases)
    // 1 = ETH_TO_ERC1155
    // 2 = ERC20_TO_ERC721
    // 3 = ERC20_TO_ERC1155
    // etc...
    let basicOrderType = 0 // Default to ETH_TO_ERC721

    if (offerItem.itemType === 3) {
      // ERC1155
      basicOrderType = 1 // ETH_TO_ERC1155
    }
    if (primaryConsideration.itemType === ItemType.ERC20) {
      basicOrderType = offerItem.itemType === 2 ? 2 : 3 // ERC20_TO_ERC721 or ERC20_TO_ERC1155
    }

    // For ERC20 payments (like USDC), the fulfiller also needs to use a conduit
    // to transfer their tokens. Use the same conduit as the offerer.
    const isERC20Payment = primaryConsideration.itemType === ItemType.ERC20
    const fulfillerConduitKey = isERC20Payment
      ? parameters.conduitKey
      : ('0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`)

    return {
      considerationToken: primaryConsideration.token || '0x0000000000000000000000000000000000000000',
      considerationIdentifier: primaryConsideration.identifierOrCriteria || BigInt(0),
      considerationAmount: primaryConsideration.startAmount,
      offerer: parameters.offerer as `0x${string}`,
      zone: parameters.zone as `0x${string}`,
      offerToken: offerItem.token as `0x${string}`,
      offerIdentifier: offerItem.identifierOrCriteria,
      offerAmount: offerItem.startAmount,
      basicOrderType,
      startTime: parameters.startTime,
      endTime: parameters.endTime,
      zoneHash: parameters.zoneHash as `0x${string}`,
      salt: BigInt(parameters.salt),
      offererConduitKey: parameters.conduitKey as `0x${string}`,
      fulfillerConduitKey,
      totalOriginalAdditionalRecipients: BigInt(additionalRecipients.length),
      additionalRecipients,
      signature: order.signature as `0x${string}`,
    }
  }

  /**
   * Build fulfillment data for a basic order (legacy)
   */
  buildBasicOrderFulfillment(order: SeaportOrder, fulfillerAddress: `0x${string}`) {
    // For a basic NFT purchase, we typically need to:
    // 1. Transfer the NFT from offerer to fulfiller (offer)
    // 2. Transfer payment from fulfiller to offerer (consideration)

    const parameters = order.parameters

    // Get the NFT being offered (usually the first offer item)
    const nftItem = parameters.offer[0]

    // Get the payment consideration (usually the first consideration item)
    const paymentItem = parameters.consideration[0]

    return {
      order,
      fulfillerAddress,
      considerationAmount: paymentItem.startAmount,
      tips: [], // No tips in basic fulfillment
    }
  }

  /**
   * Build advanced order for fulfillment
   */
  buildAdvancedOrder(order: SeaportOrder): AdvancedOrder {
    return {
      parameters: order.parameters,
      signature: order.signature,
      numerator: BigInt(1),
      denominator: BigInt(1),
      extraData: '0x' as `0x${string}`,
    }
  }

  /**
   * Build fulfillments array for matchOrders
   */
  buildFulfillments(offerItemsCount: number, considerationItemsCount: number): Fulfillment[] {
    const fulfillments: Fulfillment[] = []

    // Create fulfillments for each offer item
    for (let i = 0; i < offerItemsCount; i++) {
      fulfillments.push({
        offerComponents: [
          {
            orderIndex: 0,
            itemIndex: i,
          },
        ],
        considerationComponents: [
          {
            orderIndex: 0,
            itemIndex: i,
          },
        ],
      })
    }

    return fulfillments
  }

  /**
   * Calculate the total payment needed including fees
   */
  calculateTotalPayment(order: SeaportOrder): bigint {
    let total = BigInt(0)

    for (const consideration of order.parameters.consideration) {
      // Only count ETH/ERC20 payments (not NFTs)
      if (consideration.itemType === ItemType.NATIVE || consideration.itemType === ItemType.ERC20) {
        total += consideration.startAmount
      }
    }

    return total
  }

  /**
   * Get the payment token address
   */
  getPaymentToken(order: SeaportOrder): `0x${string}` | null {
    const paymentConsideration = order.parameters.consideration.find(
      (c) => c.itemType === ItemType.NATIVE || c.itemType === ItemType.ERC20
    )

    return paymentConsideration?.token || null
  }

  /**
   * Check if order uses ETH or ERC20
   */
  usesNativeToken(order: SeaportOrder): boolean {
    return order.parameters.consideration.some((c) => c.itemType === ItemType.NATIVE)
  }
}
