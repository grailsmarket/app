export const ANNIVERSARY_NFT_ABI = [
  {
    type: 'event',
    name: 'Transfer',
    anonymous: false,
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'tokenId', type: 'uint256', indexed: true },
    ],
  },
  {
    type: 'function',
    name: 'claim',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'account', type: 'address' },
      { name: 'tokenId', type: 'uint256' },
      { name: 'proof', type: 'bytes32[]' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'hasClaimed',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
  { type: 'error', name: 'AlreadyClaimed', inputs: [{ name: 'account', type: 'address' }] },
  { type: 'error', name: 'ClaimsClosed', inputs: [] },
  { type: 'error', name: 'InvalidProof', inputs: [] },
  { type: 'error', name: 'InvalidTokenId', inputs: [] },
  { type: 'error', name: 'TokenAlreadyExists', inputs: [] },
  { type: 'error', name: 'URIQueryForNonexistentToken', inputs: [] },
] as const
