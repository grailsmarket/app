import { getAbiItem, parseAbi } from 'viem'
import { MIGRATION_HELPER_ABI } from './MigrationHelper'
import { ENS_V2_REGISTRAR } from './RegistrarV2'

export const migrationAbi = [
  getAbiItem({ abi: ENS_V2_REGISTRAR, name: 'ETH_REGISTRY' }),
  getAbiItem({ abi: MIGRATION_HELPER_ABI, name: 'NAME_WRAPPER' }),
  ...parseAbi([
    'function getWrappedNode() view returns (bytes32)',
    'function VERIFIABLE_FACTORY() view returns (address)',
    'function WRAPPER_REGISTRY_IMPL() view returns (address)',
    'function PUBLIC_RESOLVER_SET() view returns (address)',
    'function PUBLIC_RESOLVER() view returns (address)',
    'function includes(address value) view returns (bool)',
  ]),
] as const

export const migrationEventsAbi = parseAbi([
  'event TextChanged(bytes32 indexed node, string indexed indexedKey, string key, string value)',
  'event TextChanged(bytes32 indexed node, string indexed indexedKey, string key)',
  'event AddrChanged(bytes32 indexed node, address a)',
  'event AddressChanged(bytes32 indexed node, uint256 coinType, bytes newAddress)',
  'event ContenthashChanged(bytes32 indexed node, bytes hash)',
  'event NameChanged(bytes32 indexed node, string name)',
  'event ABIChanged(bytes32 indexed node, uint256 indexed contentType)',
  'event InterfaceChanged(bytes32 indexed node, bytes4 indexed interfaceID, address implementer)',
  'event VersionChanged(bytes32 indexed node, uint64 newVersion)',
])
