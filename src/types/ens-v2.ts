import type { Address, Hex } from 'viem'

// JSON uses decimal strings for uint256 identifiers; never round them through Number.
export type RecordValue =
  | { type: 'text' | 'data'; key: string; value: string }
  | { type: 'address'; coinType: string; value: string }
  | { type: 'abi'; contentType: string; value: string }
  | { type: 'interface'; interfaceId: Hex; value: string }
  | { type: 'contenthash' | 'name'; value: string }

export interface RoleGrant {
  account: Address
  resource: string
  roles: string
  argument?: string
}

export interface IndexStatus {
  indexedThroughBlock: string
  complete: boolean
}

export interface ResolverSummary {
  chainId: number
  address: Address
  label: string | null
  deployer: Address | null
  implementation: Address
  supported: boolean
  configurationCount: number
  nameCount: number
  ownedNameCount: number
  lastActivity: string | null
  defaultRecordId: string | null
  grants: RoleGrant[]
  index: IndexStatus
}

export interface ConfigurationSummary {
  recordId: string
  label: string | null
  recordCount: number
  nameCount: number
  explicitNameCount: number
  defaultNameCount: number
  isDefault: boolean
}

export interface Configuration extends ConfigurationSummary {
  resolver: Address
  chainId: number
  anchor: Hex | null
  records: RecordValue[]
  recordsComplete: boolean
  index: IndexStatus
}

export interface ConfigurationName {
  name: string
  owner: Address | null
  linkMode: 'explicit' | 'default'
  inheritedResolver: boolean
}

export interface NameContext {
  name: string
  version: 'v1' | 'v2'
  registry: Address
  canonicalId: string
  resolver: Address
  resolverKind: 'permissioned' | 'legacy' | 'custom'
  explicitRecordId: string
  effectiveRecordId: string | null
  inheritedResolver: boolean
}

export interface Page<T> {
  items: T[]
  nextCursor: string | null
}

export interface ResolverPreferences {
  preferredResolver: Address | null
}

export const configurationPath = (chainId: number, resolver: Address, recordId: string) =>
  `/settings/records/${chainId}/${resolver}/${recordId}`

export const recordIdentity = (record: RecordValue) => {
  switch (record.type) {
    case 'text':
    case 'data':
      return `${record.type}:${record.key}`
    case 'address':
      return `address:${record.coinType}`
    case 'abi':
      return `abi:${record.contentType}`
    case 'interface':
      return `interface:${record.interfaceId.toLowerCase()}`
    default:
      return record.type
  }
}

export interface NameRecordSnapshot {
  name: string
  resolver: Address
  records: RecordValue[]
  complete: boolean
  indexedThroughBlock: string
  warnings: string[]
}
