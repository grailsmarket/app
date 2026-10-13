import { encodeAbiParameters, isAddressEqual, keccak256, stringToHex, type Address, type Hex } from 'viem'
import type { RecordValue, RoleGrant } from '@/types/ens-v2'

export const RESOLVER_ROLES = {
  address: BigInt(1) << BigInt(0),
  text: BigInt(1) << BigInt(4),
  contenthash: BigInt(1) << BigInt(8),
  abi: BigInt(1) << BigInt(12),
  interface: BigInt(1) << BigInt(16),
  name: BigInt(1) << BigInt(20),
  data: BigInt(1) << BigInt(24),
  link: BigInt(1) << BigInt(28),
  contractName: BigInt(1) << BigInt(120),
  upgrade: BigInt(1) << BigInt(124),
} as const
export const adminRole = (role: bigint) => role << BigInt(128)
export const ALL_RESOLVER_ROLES = Object.values(RESOLVER_ROLES).reduce(
  (bitmap, role) => bitmap | role | adminRole(role),
  BigInt(0)
)

export function recordPermission(record: RecordValue) {
  let resource = BigInt(0)
  if (record.type === 'text' || record.type === 'data') resource = BigInt(keccak256(stringToHex(record.key)))
  if (record.type === 'address' || record.type === 'abi') {
    const argument = BigInt(record.type === 'address' ? record.coinType : record.contentType)
    resource = BigInt(keccak256(encodeAbiParameters([{ type: 'uint256' }], [argument])))
  }
  if (record.type === 'interface') resource = BigInt(keccak256(record.interfaceId))
  return { resource, role: RESOLVER_ROLES[record.type] }
}

export function hasPermission(grants: RoleGrant[], account: Address | undefined, role: bigint, resource = BigInt(0)) {
  if (!account) return false
  const effective = grants
    .filter((grant) => isAddressEqual(grant.account, account) && [BigInt(0), resource].includes(BigInt(grant.resource)))
    .reduce((bitmap, grant) => bitmap | BigInt(grant.roles), BigInt(0))
  return (effective & role) === role
}

export function canEditRecord(grants: RoleGrant[], account: Address | undefined, record: RecordValue) {
  try {
    const { resource, role } = recordPermission(record)
    return hasPermission(grants, account, role, resource)
  } catch {
    return false
  }
}

export function accessLabel(grants: RoleGrant[], account: Address | undefined) {
  if (hasPermission(grants, account, ALL_RESOLVER_ROLES)) return 'Full control'
  const setters = (Object.keys(RESOLVER_ROLES) as (keyof typeof RESOLVER_ROLES)[])
    .filter((key) => !['link', 'contractName', 'upgrade'].includes(key))
    .reduce((bits, key) => bits | RESOLVER_ROLES[key], BigInt(0))
  if (hasPermission(grants, account, setters)) return 'Record editor'
  if (account && grants.some((grant) => isAddressEqual(grant.account, account) && BigInt(grant.roles) !== BigInt(0)))
    return 'Limited access'
  return 'View only'
}

export function emptyRecordFor(grants: RoleGrant[], account: Address): RecordValue | null {
  const candidates: RecordValue[] = [
    { type: 'text', key: 'avatar', value: '' },
    { type: 'contenthash', value: '0x' },
    { type: 'name', value: '' },
    { type: 'address', coinType: '60', value: '0x' },
    { type: 'data', key: 'data', value: '0x' },
    { type: 'abi', contentType: '1', value: '0x' },
    { type: 'interface', interfaceId: '0x00000000', value: '0x0000000000000000000000000000000000000000' },
  ]
  for (const grant of grants) {
    if (!grant.argument || !isAddressEqual(grant.account, account)) continue
    const roles = BigInt(grant.roles)
    if (roles & RESOLVER_ROLES.text) candidates.push({ type: 'text', key: grant.argument, value: '' })
    if (roles & RESOLVER_ROLES.data) candidates.push({ type: 'data', key: grant.argument, value: '0x' })
    if (roles & RESOLVER_ROLES.address) candidates.push({ type: 'address', coinType: grant.argument, value: '0x' })
    if (roles & RESOLVER_ROLES.interface && /^0x[0-9a-fA-F]{8}$/.test(grant.argument))
      candidates.push({
        type: 'interface',
        interfaceId: grant.argument as Hex,
        value: '0x0000000000000000000000000000000000000000',
      })
    if (roles & RESOLVER_ROLES.abi) candidates.push({ type: 'abi', contentType: grant.argument, value: '0x' })
  }
  return candidates.find((record) => canEditRecord(grants, account, record)) ?? null
}
