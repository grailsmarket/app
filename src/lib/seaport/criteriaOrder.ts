/**
 * Seaport Criteria-Based Order Support
 *
 * Builds criteria merkle trees for "n-of-many" and "pick-one" offers.
 * Uses sorted-pair hashing (different from bulkSignature.ts's unsorted pairs).
 *
 * Ported from backend: services/sdk/src/seaport/criteria-order.ts
 */

import { keccak256, encodePacked } from 'viem'

/**
 * Hash a token ID leaf for the criteria merkle tree.
 * Seaport expects keccak256(abi.encodePacked(tokenId)).
 */
function hashTokenId(tokenId: string): string {
  return keccak256(encodePacked(['uint256'], [BigInt(tokenId)]))
}

/**
 * Hash two sorted sibling nodes.
 * Seaport criteria trees use sorted pair hashing (smaller hash first).
 */
function hashSortedPair(a: string, b: string): string {
  const aLower = a.toLowerCase()
  const bLower = b.toLowerCase()
  if (aLower <= bLower) {
    return keccak256(encodePacked(['bytes32', 'bytes32'], [a as `0x${string}`, b as `0x${string}`]))
  }
  return keccak256(encodePacked(['bytes32', 'bytes32'], [b as `0x${string}`, a as `0x${string}`]))
}

function nextPow2(n: number): number {
  let p = 1
  while (p < n) p *= 2
  return p
}

/**
 * Build a sorted merkle tree from token ID hashes.
 * Returns all layers (leaves at 0, root at last).
 */
function buildSortedMerkleTree(leaves: string[]): string[][] {
  const paddedCount = nextPow2(leaves.length)
  const paddedLeaves = [...leaves]
  while (paddedLeaves.length < paddedCount) {
    paddedLeaves.push('0x' + '00'.repeat(32))
  }

  const layers: string[][] = [paddedLeaves]
  let currentLayer = paddedLeaves

  while (currentLayer.length > 1) {
    const nextLayer: string[] = []
    for (let i = 0; i < currentLayer.length; i += 2) {
      nextLayer.push(hashSortedPair(currentLayer[i], currentLayer[i + 1]))
    }
    layers.push(nextLayer)
    currentLayer = nextLayer
  }

  return layers
}

/**
 * Extract proof for a given leaf index in a sorted merkle tree.
 */
function getSortedMerkleProof(layers: string[][], index: number): string[] {
  const proof: string[] = []
  let idx = index

  for (let i = 0; i < layers.length - 1; i++) {
    const siblingIndex = idx % 2 === 0 ? idx + 1 : idx - 1
    if (siblingIndex < layers[i].length) {
      proof.push(layers[i][siblingIndex])
    }
    idx = Math.floor(idx / 2)
  }

  return proof
}

/**
 * Build a criteria merkle tree from an array of token IDs.
 *
 * @param tokenIds - Array of ENS token IDs to include
 * @returns Merkle root and proofs for each token ID
 */
export function buildCriteriaMerkleTree(tokenIds: string[]): {
  merkleRoot: string
  proofs: Map<string, string[]>
  sortedTokenIds: string[]
} {
  if (tokenIds.length === 0) {
    throw new Error('At least one token ID required')
  }

  if (tokenIds.length === 1) {
    const leaf = hashTokenId(tokenIds[0])
    return {
      merkleRoot: leaf,
      proofs: new Map([[tokenIds[0], []]]),
      sortedTokenIds: tokenIds,
    }
  }

  // Hash and sort leaves
  const hashedLeaves = tokenIds.map((id) => ({
    tokenId: id,
    hash: hashTokenId(id),
  }))

  // Sort by hash for deterministic tree
  hashedLeaves.sort((a, b) => a.hash.toLowerCase().localeCompare(b.hash.toLowerCase()))

  const sortedTokenIds = hashedLeaves.map((l) => l.tokenId)
  const leafHashes = hashedLeaves.map((l) => l.hash)

  const layers = buildSortedMerkleTree(leafHashes)
  const merkleRoot = layers[layers.length - 1][0]

  // Build proofs for each token
  const proofs = new Map<string, string[]>()
  for (let i = 0; i < hashedLeaves.length; i++) {
    proofs.set(hashedLeaves[i].tokenId, getSortedMerkleProof(layers, i))
  }

  return { merkleRoot, proofs, sortedTokenIds }
}
