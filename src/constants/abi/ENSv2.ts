import { parseAbi } from 'viem'

export const ENS_V2_UNIVERSAL_RESOLVER_ABI = parseAbi([
  'function isENSv2() pure returns (bool)',
  'function resolve(bytes name, bytes data) view returns (bytes, address)',
])

export const ENS_V2_REGISTRAR_ABI = parseAbi([
  'function MIN_COMMITMENT_AGE() view returns (uint64)',
  'function MAX_COMMITMENT_AGE() view returns (uint64)',
  'function commitmentAt(bytes32 commitment) view returns (uint64)',
  'function isAvailable(string label) view returns (bool)',
  'function makeCommitment(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, bytes32 referrer) pure returns (bytes32)',
  'function getRegisterPrice(string label, uint64 duration, address paymentToken) view returns (uint256 base, uint256 premium)',
  'function commit(bytes32 commitment)',
  'function register(string label, address owner, bytes32 secret, address subregistry, address resolver, uint64 duration, address paymentToken, bytes32 referrer) returns (uint256)',
  'function isRenewable(string label) view returns (bool)',
  'function getRenewPrice(string label, uint64 duration, address paymentToken) view returns (uint256)',
  'function renewBatch((string label, uint64 duration, bytes32 referrer)[] rds, address paymentToken)',
])

export const ENS_V2_REGISTRY_ABI = parseAbi([
  'struct State { uint8 status; uint64 expiry; address latestOwner; uint256 tokenId; uint256 resource; }',
  'function getState(uint256 anyId) view returns (State)',
  'function getResolver(string label) view returns (address)',
  'function setResolver(uint256 anyId, address resolver)',
  'function hasRoles(uint256 anyId, uint256 roleBitmap, address account) view returns (bool)',
  'function isOnlyAssignee(uint256 resource, uint256 roleBitmap, address account) view returns (bool)',
  'function safeTransferFrom(address from, address to, uint256 id, uint256 value, bytes data)',
])

export const ENS_V2_RESOLVER_ABI = parseAbi([
  'function supportsInterface(bytes4 interfaceId) view returns (bool)',
  'function setText(bytes name, string key, string value)',
  'function setAddress(bytes name, uint256 coinType, bytes addressBytes)',
  'function setContenthash(bytes name, bytes hash)',
  'function linkToRecord(bytes name, uint256 recordId)',
  'function multicall(bytes[] calls) returns (bytes[])',
  'function initialize((address account, uint256 roleBitmap)[] grants, bytes[] calls)',
])

export const VERIFIABLE_FACTORY_ABI = parseAbi([
  'function predictProxyAddress(address deployer, uint256 salt) view returns (address)',
  'function deployProxy(address implementation, uint256 salt, bytes data) returns (address)',
])

export const MIGRATION_HELPER_ABI = parseAbi([
  'struct Data { string label; address owner; address subregistry; address resolver; }',
  'struct LockedChildren { bytes parentName; Data[][] groups; }',
  'function migrate(Data[] unwrapped, Data[][] unlockedGroups, Data[][] lockedGroups, LockedChildren[] lockedChildrenGroups)',
])

export const ENS_V1_MIGRATION_ABI = parseAbi([
  'function getData(uint256 id) view returns (address owner, uint32 fuses, uint64 expiry)',
  'function getApproved(uint256 tokenId) view returns (address)',
  'function resolver(bytes32 node) view returns (address)',
])
