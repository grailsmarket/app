/**
 * Seaport Order Builder for Bulk Offers
 * Ported from backend SDK. Only dependency: viem.
 */

import { keccak256, encodeAbiParameters, parseAbiParameters } from 'viem'
import type { SeaportOrder, SeaportOfferItem, SeaportConsiderationItem, BuildBulkOfferOrdersParams } from './bulkTypes'
import { OrderType, ItemType } from './bulkTypes'

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

export class BulkOfferOrderBuilder {
  buildOfferOrder(params: {
    tokenId: string
    offerAmountWei: string
    offerer: string
    durationDays?: number
  }): SeaportOrder {
    const { tokenId, offerAmountWei, offerer, durationDays = 7 } = params

    const startTime = Math.floor(Date.now() / 1000)
    const endTime = startTime + durationDays * 24 * 60 * 60
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

    return offers.map((item) =>
      this.buildOfferOrder({
        tokenId: item.tokenId,
        offerAmountWei: item.offerAmountWei,
        offerer,
        durationDays,
      })
    )
  }
}
