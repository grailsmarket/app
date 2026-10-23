import type { Address, Hex } from 'viem'
import type { RecordConfiguration, ResolverDetails } from './ens'

export type V2RecordKind = 'text' | 'address' | 'contenthash' | 'name' | 'abi' | 'interface' | 'data'

export type V2RecordField = {
  kind: V2RecordKind
  key: string
}

export type V2Record = V2RecordField & {
  value: string
  initialValue: string
  editable: boolean
}

export type V2NameResolver = {
  registry: Address
  resolver: Address
  directResolver: Address
  label: string
  resource: bigint
  canSetResolver: boolean
  registered: boolean
  inherited: boolean
}

export type V2ResolverCatalog = {
  blockNumber: bigint
  recordCount: bigint
  defaultRecordId: bigint
  linkedRecordId: bigint
  canLink: boolean
  historyComplete: boolean
  lastActivityBlock?: bigint
  fields: Map<string, V2RecordField[]>
  // The latest links include internal placeholder names, so they are not name counts.
  names: Map<Hex, { recordId: bigint; dnsName: Hex }>
  interfaces: Map<string, Address>
  configurations?: RecordConfiguration[]
  permissions?: ResolverDetails
}

export type V2RecordMode = 'shared' | 'new' | 'copy'
