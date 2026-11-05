import { getAbiItem, parseAbi, zeroHash } from 'viem'
import { PublicResolverAbi } from './PublicResolverAbi'

// These selectors are passed to PermissionedResolver.resolve(); they are not standalone getters on that contract.
export const RESOLVER_PROFILES_ABI = [
  getAbiItem({ abi: PublicResolverAbi, name: 'text' }),
  getAbiItem({ abi: PublicResolverAbi, name: 'addr', args: [zeroHash, BigInt(60)] }),
  getAbiItem({ abi: PublicResolverAbi, name: 'contenthash' }),
  ...parseAbi([
    'function hasAddr(bytes32 node, uint256 coinType) view returns (bool)',
    'function name(bytes32 node) view returns (string)',
    'function ABI(bytes32 node, uint256 contentTypes) view returns (uint256, bytes)',
    'function interfaceImplementer(bytes32 node, bytes4 interfaceId) view returns (address)',
    'function data(bytes32 node, string key) view returns (bytes)',
  ]),
] as const
