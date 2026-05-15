const BYTES32_HEX_PATTERN = /^0x[0-9a-fA-F]{64}$/
const DECIMAL_TOKEN_ID_PATTERN = /^\d+$/
const MAX_UINT256_DECIMAL_DIGITS = 78
const MAX_UINT256 = BigInt(2) ** BigInt(256) - BigInt(1)

export const ETH_NODE = '0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae'

export type NameIdentifierSearch =
  | {
      kind: 'bytes32'
      value: string
    }
  | {
      kind: 'tokenId'
      value: string
      bytes32: string
    }

export const parseNameIdentifierSearch = (input: string): NameIdentifierSearch | null => {
  const value = input.trim()

  if (BYTES32_HEX_PATTERN.test(value)) {
    return {
      kind: 'bytes32',
      value: value.toLowerCase(),
    }
  }

  if (!DECIMAL_TOKEN_ID_PATTERN.test(value)) return null
  if (value.length > MAX_UINT256_DECIMAL_DIGITS) return null

  try {
    const tokenId = BigInt(value)
    if (tokenId > MAX_UINT256) return null

    return {
      kind: 'tokenId',
      value,
      bytes32: `0x${tokenId.toString(16).padStart(64, '0')}`,
    }
  } catch {
    return null
  }
}
