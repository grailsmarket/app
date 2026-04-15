/**
 * Seaport Bulk Signature Support
 * Ported from backend SDK. Only dependency: viem.
 *
 * Implements merkle tree construction for Seaport bulk orders (EIP-712).
 * Allows signing N independent offers with a single wallet signature.
 * Tree depths 1-24 supported (2 to 16M orders).
 */

import { keccak256, encodeAbiParameters, parseAbiParameters, concat, toHex } from 'viem'
import type { SeaportOrder, BulkSignatureResult, IndividualBulkSignature } from './bulkTypes'

const SEAPORT_ADDRESS = '0x0000000000000068F116a894984e2DB1123eB395'
const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000'

// EIP-712 type hashes for OrderComponents struct hashing
const ORDER_COMPONENTS_TYPEHASH = keccak256(
  toHex(
    'OrderComponents(address offerer,address zone,OfferItem[] offer,ConsiderationItem[] consideration,uint8 orderType,uint256 startTime,uint256 endTime,bytes32 zoneHash,uint256 salt,bytes32 conduitKey,uint256 counter)ConsiderationItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount,address recipient)OfferItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount)',
    { size: undefined }
  )
)

const OFFER_ITEM_TYPEHASH = keccak256(
  toHex(
    'OfferItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount)',
    { size: undefined }
  )
)

const CONSIDERATION_ITEM_TYPEHASH = keccak256(
  toHex(
    'ConsiderationItem(uint8 itemType,address token,uint256 identifierOrCriteria,uint256 startAmount,uint256 endAmount,address recipient)',
    { size: undefined }
  )
)

function hashOfferItem(item: {
  itemType: number
  token: string
  identifierOrCriteria: string
  startAmount: string
  endAmount: string
}): `0x${string}` {
  return keccak256(
    encodeAbiParameters(parseAbiParameters('bytes32, uint8, address, uint256, uint256, uint256'), [
      OFFER_ITEM_TYPEHASH,
      item.itemType,
      item.token as `0x${string}`,
      BigInt(item.identifierOrCriteria),
      BigInt(item.startAmount),
      BigInt(item.endAmount),
    ])
  )
}

function hashConsiderationItem(item: {
  itemType: number
  token: string
  identifierOrCriteria: string
  startAmount: string
  endAmount: string
  recipient: string
}): `0x${string}` {
  return keccak256(
    encodeAbiParameters(parseAbiParameters('bytes32, uint8, address, uint256, uint256, uint256, address'), [
      CONSIDERATION_ITEM_TYPEHASH,
      item.itemType,
      item.token as `0x${string}`,
      BigInt(item.identifierOrCriteria),
      BigInt(item.startAmount),
      BigInt(item.endAmount),
      item.recipient as `0x${string}`,
    ])
  )
}

/**
 * Compute the EIP-712 struct hash for an OrderComponents.
 * Matches what Seaport computes internally for order verification.
 */
function hashOrderComponents(order: SeaportOrder, counter: bigint): `0x${string}` {
  const offerHashes = order.offer.map(hashOfferItem)
  const offerArrayHash = keccak256(offerHashes.length > 0 ? concat(offerHashes) : ('0x' as `0x${string}`))

  const considerationHashes = order.consideration.map(hashConsiderationItem)
  const considerationArrayHash = keccak256(
    considerationHashes.length > 0 ? concat(considerationHashes) : ('0x' as `0x${string}`)
  )

  return keccak256(
    encodeAbiParameters(
      parseAbiParameters(
        'bytes32, address, address, bytes32, bytes32, uint8, uint256, uint256, bytes32, uint256, bytes32, uint256'
      ),
      [
        ORDER_COMPONENTS_TYPEHASH,
        order.offerer as `0x${string}`,
        order.zone as `0x${string}`,
        offerArrayHash,
        considerationArrayHash,
        order.orderType,
        BigInt(order.startTime),
        BigInt(order.endTime),
        order.zoneHash as `0x${string}`,
        BigInt(order.salt),
        order.conduitKey as `0x${string}`,
        counter,
      ]
    )
  )
}

const SEAPORT_DOMAIN = {
  name: 'Seaport',
  version: '1.6',
  chainId: 1,
  verifyingContract: SEAPORT_ADDRESS as `0x${string}`,
}

const ORDER_COMPONENTS_TYPE = [
  { name: 'offerer', type: 'address' },
  { name: 'zone', type: 'address' },
  { name: 'offer', type: 'OfferItem[]' },
  { name: 'consideration', type: 'ConsiderationItem[]' },
  { name: 'orderType', type: 'uint8' },
  { name: 'startTime', type: 'uint256' },
  { name: 'endTime', type: 'uint256' },
  { name: 'zoneHash', type: 'bytes32' },
  { name: 'salt', type: 'uint256' },
  { name: 'conduitKey', type: 'bytes32' },
  { name: 'counter', type: 'uint256' },
]

const OFFER_ITEM_TYPE = [
  { name: 'itemType', type: 'uint8' },
  { name: 'token', type: 'address' },
  { name: 'identifierOrCriteria', type: 'uint256' },
  { name: 'startAmount', type: 'uint256' },
  { name: 'endAmount', type: 'uint256' },
]

const CONSIDERATION_ITEM_TYPE = [
  { name: 'itemType', type: 'uint8' },
  { name: 'token', type: 'address' },
  { name: 'identifierOrCriteria', type: 'uint256' },
  { name: 'startAmount', type: 'uint256' },
  { name: 'endAmount', type: 'uint256' },
  { name: 'recipient', type: 'address' },
]

function nextPow2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

function log2(n: number): number {
  let h = 0
  let v = n
  while (v > 1) {
    v >>= 1
    h++
  }
  return h
}

function hashPair(a: string, b: string): string {
  return keccak256(
    encodeAbiParameters(parseAbiParameters('bytes32, bytes32'), [a as `0x${string}`, b as `0x${string}`])
  )
}

function buildMerkleTree(leaves: string[]): string[][] {
  const layers: string[][] = [leaves]
  let currentLayer = leaves

  while (currentLayer.length > 1) {
    const nextLayer: string[] = []
    for (let i = 0; i < currentLayer.length; i += 2) {
      nextLayer.push(hashPair(currentLayer[i], currentLayer[i + 1]))
    }
    layers.push(nextLayer)
    currentLayer = nextLayer
  }

  return layers
}

function getMerkleProof(layers: string[][], index: number): string[] {
  const proof: string[] = []
  let idx = index

  for (let i = 0; i < layers.length - 1; i++) {
    const siblingIndex = idx % 2 === 0 ? idx + 1 : idx - 1
    proof.push(layers[i][siblingIndex])
    idx = Math.floor(idx / 2)
  }

  return proof
}

function getBulkOrderTypeName(height: number): string {
  return 'OrderComponents' + '[2]'.repeat(height)
}

function buildTreeMessage(orders: SeaportOrder[], paddedCount: number, counter: bigint): any {
  const components = []
  for (let i = 0; i < paddedCount; i++) {
    if (i < orders.length) {
      const order = orders[i]
      components.push({
        offerer: order.offerer,
        zone: order.zone,
        offer: order.offer.map((item) => ({
          itemType: item.itemType,
          token: item.token,
          identifierOrCriteria: item.identifierOrCriteria,
          startAmount: item.startAmount,
          endAmount: item.endAmount,
        })),
        consideration: order.consideration.map((item) => ({
          itemType: item.itemType,
          token: item.token,
          identifierOrCriteria: item.identifierOrCriteria,
          startAmount: item.startAmount,
          endAmount: item.endAmount,
          recipient: item.recipient,
        })),
        orderType: order.orderType,
        startTime: order.startTime,
        endTime: order.endTime,
        zoneHash: order.zoneHash,
        salt: order.salt,
        conduitKey: order.conduitKey,
        counter: counter.toString(),
      })
    } else {
      components.push({
        offerer: '0x0000000000000000000000000000000000000000',
        zone: '0x0000000000000000000000000000000000000000',
        offer: [],
        consideration: [],
        orderType: 0,
        startTime: 0,
        endTime: 0,
        zoneHash: ZERO_BYTES32,
        salt: '0',
        conduitKey: ZERO_BYTES32,
        counter: '0',
      })
    }
  }

  function nestArray(arr: any[], depth: number): any {
    if (depth === 1) {
      return arr
    }
    const half = arr.length / 2
    return [nestArray(arr.slice(0, half), depth - 1), nestArray(arr.slice(half), depth - 1)]
  }

  const height = log2(paddedCount)
  return nestArray(components, height)
}

export function prepareBulkSignature(orders: SeaportOrder[], counter: bigint): BulkSignatureResult {
  if (orders.length === 0) {
    throw new Error('At least one order required')
  }
  if (orders.length > 16777216) {
    throw new Error('Maximum 16,777,216 orders supported')
  }

  const paddedCount = nextPow2(orders.length)
  const treeHeight = log2(paddedCount)

  if (treeHeight < 1) {
    throw new Error('At least 2 orders required for bulk signing')
  }

  // Build leaf hashes — proper EIP-712 OrderComponents struct hashes
  // These must match the hashes Seaport computes when verifying the bulk signature
  const leaves: string[] = []
  for (let i = 0; i < paddedCount; i++) {
    if (i < orders.length) {
      leaves.push(hashOrderComponents(orders[i], counter))
    } else {
      // Dummy order: use the struct hash of the dummy order for consistency
      leaves.push(
        hashOrderComponents(
          {
            offerer: '0x0000000000000000000000000000000000000000',
            zone: '0x0000000000000000000000000000000000000000',
            offer: [],
            consideration: [],
            orderType: 0,
            startTime: 0,
            endTime: 0,
            zoneHash: ZERO_BYTES32,
            salt: '0',
            conduitKey: ZERO_BYTES32,
            totalOriginalConsiderationItems: 0,
          },
          counter
        )
      )
    }
  }

  const layers = buildMerkleTree(leaves)
  const merkleRoot = layers[layers.length - 1][0]

  const bulkOrderType = getBulkOrderTypeName(treeHeight)
  const treeMessage = buildTreeMessage(orders, paddedCount, counter)

  const typedData = {
    domain: SEAPORT_DOMAIN,
    types: {
      BulkOrder: [{ name: 'tree', type: bulkOrderType }],
      OrderComponents: ORDER_COMPONENTS_TYPE,
      OfferItem: OFFER_ITEM_TYPE,
      ConsiderationItem: CONSIDERATION_ITEM_TYPE,
    },
    primaryType: 'BulkOrder' as const,
    message: { tree: treeMessage },
  }

  return {
    leaves,
    treeHeight,
    merkleRoot,
    typedData,
    paddedCount,
  }
}

export function extractBulkSignatures(
  signature: string,
  result: BulkSignatureResult,
  orders: SeaportOrder[]
): IndividualBulkSignature[] {
  const rawSig = signature.startsWith('0x') ? signature.slice(2) : signature

  // Convert 65-byte signature to 64-byte compact format (EIP-2098)
  const r = rawSig.slice(0, 64)
  const s = rawSig.slice(64, 128)
  const v = parseInt(rawSig.slice(128, 130), 16)

  const sBigInt = BigInt('0x' + s)
  const compactS = v === 28 ? (sBigInt | (BigInt(1) << BigInt(255))).toString(16).padStart(64, '0') : s
  const compactSig = r + compactS

  const layers = buildMerkleTree(result.leaves)

  const signatures: IndividualBulkSignature[] = []

  for (let i = 0; i < orders.length; i++) {
    const proof = getMerkleProof(layers, i)

    // Encode: compact_sig (64 bytes) + index (3 bytes) + proof (N*32 bytes)
    // Seaport derives tree height from the signature length — it is NOT encoded explicitly.
    const indexHex = i.toString(16).padStart(6, '0')
    const proofHex = proof.map((p) => (p.startsWith('0x') ? p.slice(2) : p)).join('')

    const bulkSig = '0x' + compactSig + indexHex + proofHex

    signatures.push({
      orderIndex: i,
      order: orders[i],
      signature: bulkSig,
    })
  }

  return signatures
}
