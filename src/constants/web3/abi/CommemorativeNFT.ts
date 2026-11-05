import { parseAbi } from 'viem'

export const COMMEMORATIVE_NFT_ADDRESS = '0x20262e3433306a4FF250a64d20a8E0F09B2C7F68'

export const COMMEMORATIVE_NFT_ABI = parseAbi([
  'function claim(bytes32[] proof)',
  'function hasClaimed(address account) view returns (bool)',
  'function baseURI() view returns (string)',
  'function merkleRoot() view returns (bytes32)',
  'event Claimed(address indexed eoa, uint256 indexed tokenId)',
  'error AlreadyClaimed(uint256 tokenId)',
  'error InvalidProof()',
])
