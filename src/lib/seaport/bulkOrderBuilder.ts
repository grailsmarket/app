/**
 * Seaport Order Builder for Bulk Offers
 * Ported from backend SDK. Only dependency: viem.
 */

import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem'
import type { SeaportOrder, SeaportOfferItem, SeaportConsiderationItem, BuildBulkOfferOrdersParams } from './bulkTypes'
import { OrderType, ItemType } from './bulkTypes'
import { buildCriteriaMerkleTree } from './criteriaOrder'

const ENS_REGISTRAR_ADDRESS = '0x57f1887a8BF19b14fC0dF6Fd9B2acc9Af147eA85'
const WETH_ADDRESS = '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

function generateSalt(offerer: string, tokenId: string): string {
  return keccak256(
    encodeAbiParameters(parseAbiParameters('uint256, address, uint256'), [
      BigInt(Date.now()),
      offerer as `0x${string}`,
      BigInt(tokenId),
    ])
  )
}

function calculateFee(priceWei: string, basisPoints: number): bigint {
  const price = BigInt(priceWei)
  return (price * BigInt(basisPoints)) / BigInt(10000)
}

export class BulkOfferOrderBuilder {
  buildOfferOrder(params: {
    tokenId: string
    offerAmountWei: string
    offerer: string
    durationDays?: number
    startTime?: number
    endTime?: number
  }): SeaportOrder {
    const {
      tokenId,
      offerAmountWei,
      offerer,
      durationDays = 7,
      startTime: providedStartTime,
      endTime: providedEndTime,
    } = params

    // Use provided times (for batch consistency) or compute from current time
    const startTime = providedStartTime ?? Math.floor(Date.now() / 1000)
    const endTime = providedEndTime ?? startTime + durationDays * 24 * 60 * 60
    const salt = generateSalt(offerer, tokenId)

    const offer: SeaportOfferItem[] = [
      {
        itemType: ItemType.ERC20,
        token: WETH_ADDRESS,
        identifierOrCriteria: '0',
        startAmount: offerAmountWei,
        endAmount: offerAmountWei,
      },
    ]

    const consideration: SeaportConsiderationItem[] = [
      {
        itemType: ItemType.ERC721,
        token: ENS_REGISTRAR_ADDRESS,
        identifierOrCriteria: tokenId,
        startAmount: '1',
        endAmount: '1',
        recipient: offerer,
      },
    ]

    return {
      offerer,
      zone: ZERO_ADDRESS,
      offer,
      consideration,
      orderType: OrderType.FULL_OPEN,
      startTime,
      endTime,
      zoneHash: ZERO_BYTES32,
      salt,
      conduitKey: ZERO_BYTES32,
      totalOriginalConsiderationItems: consideration.length,
    }
  }

  buildBulkOfferOrders(params: BuildBulkOfferOrdersParams): SeaportOrder[] {
    const { offers, offerer, durationDays = 7 } = params

    // Compute timing once for consistency across all orders in the batch
    const startTime = Math.floor(Date.now() / 1000)
    const endTime = startTime + durationDays * 24 * 60 * 60

    return offers.map((item) =>
      this.buildOfferOrder({
        tokenId: item.tokenId,
        offerAmountWei: item.offerAmountWei,
        offerer,
        durationDays,
        startTime,
        endTime,
      })
    )
  }

  /**
   * Build n-of-many offer orders.
   * Creates N criteria-based offers, each valid for any of M candidate names.
   * All N orders share the same merkle root but have unique salts.
   */
  buildNOfManyOfferOrders(params: {
    tokenIds: string[]
    offerAmountsWei: string[]
    offerer: string
    count: number
    durationDays?: number
    currencyAddress?: string
    platformFeeRecipient?: string
    platformFeeBps?: number
  }): {
    orders: SeaportOrder[]
    merkleRoot: string
    proofs: Map<string, string[]>
    sortedTokenIds: string[]
  } {
    const {
      tokenIds,
      offerAmountsWei,
      offerer,
      count,
      durationDays = 7,
      currencyAddress,
      platformFeeRecipient,
      platformFeeBps = 0,
    } = params

    if (tokenIds.length < 2) {
      throw new Error('At least 2 token IDs required for n-of-many offers')
    }
    if (count < 1) {
      throw new Error('Count must be at least 1')
    }
    if (count > tokenIds.length) {
      throw new Error('Count cannot exceed the number of token IDs')
    }

    const { merkleRoot, proofs, sortedTokenIds } = buildCriteriaMerkleTree(tokenIds)

    const startTime = Math.floor(Date.now() / 1000)
    const endTime = startTime + durationDays * 24 * 60 * 60
    const token = currencyAddress || WETH_ADDRESS

    const orders: SeaportOrder[] = []
    for (let i = 0; i < count; i++) {
      const salt = keccak256(
        encodeAbiParameters(parseAbiParameters('uint256, address, uint256'), [
          BigInt(Date.now()),
          offerer as `0x${string}`,
          BigInt(i),
        ])
      )

      const offer: SeaportOfferItem[] = [
        {
          itemType: ItemType.ERC20,
          token,
          identifierOrCriteria: '0',
          startAmount: offerAmountsWei[i],
          endAmount: offerAmountsWei[i],
        },
      ]

      const consideration: SeaportConsiderationItem[] = [
        {
          itemType: ItemType.ERC721_WITH_CRITERIA,
          token: ENS_REGISTRAR_ADDRESS,
          identifierOrCriteria: merkleRoot,
          startAmount: '1',
          endAmount: '1',
          recipient: offerer,
        },
      ]

      // Add platform fee if applicable
      if (platformFeeRecipient && platformFeeBps > 0) {
        const fee = calculateFee(offerAmountWei, platformFeeBps)
        consideration.push({
          itemType: ItemType.ERC20,
          token,
          identifierOrCriteria: '0',
          startAmount: fee.toString(),
          endAmount: fee.toString(),
          recipient: platformFeeRecipient,
        })
      }

      orders.push({
        offerer,
        zone: ZERO_ADDRESS,
        offer,
        consideration,
        orderType: OrderType.FULL_OPEN,
        startTime,
        endTime,
        zoneHash: ZERO_BYTES32,
        salt,
        conduitKey: ZERO_BYTES32,
        totalOriginalConsiderationItems: consideration.length,
      })
    }

    return { orders, merkleRoot, proofs, sortedTokenIds }
  }
}
