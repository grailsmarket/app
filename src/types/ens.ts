import { RESOLVER_ADMIN_ROLES, RESOLVER_ROLES } from '@/constants/ens/resolver'
import type { Address, Hex } from 'viem'

export type ResolverRole = (typeof RESOLVER_ROLES)[number]

export type ResolverAdminRole = (typeof RESOLVER_ADMIN_ROLES)[number]

export type Resolver = {
  address: Address
  name?: string | null
  nameCount: number | null
  roles: (ResolverRole | ResolverAdminRole)[]
  isDefault: boolean
  managesRecords?: boolean
  keyGrants?: ResolverKeyPermission[]
  createdAt?: string | null
  updatedAt?: string | null
  createdBlock?: number
  updatedBlock?: number
}

export type SettingsResolver = Resolver & { deployedBy?: Address; delegated?: boolean }

export interface PreferredResolver {
  address: Address
  label: string | null
  hasRoles: boolean
}

export interface LabeledResolver {
  address: Address
  label: string | null
  isPreferred: boolean
  resolver: AccountResolver
}

export interface ResolverPreferences {
  preferred: PreferredResolver | null
  total: number
  resolvers: LabeledResolver[]
}

export interface LabeledConfiguration {
  recordId: string
  label: string | null
  record: RecordConfiguration | null
}

export interface ConfigurationPreferences {
  resolver: Address
  recordCount: number
  defaultRecordId: string | null
  total: number
  limit: number
  offset: number
  records: LabeledConfiguration[]
}

export type ResolverRoleName =
  | 'set_address'
  | 'set_text'
  | 'set_contenthash'
  | 'set_abi'
  | 'set_interface'
  | 'set_name'
  | 'set_data'
  | 'link'
  | 'can_name'
  | 'upgrade'

export interface ResolverPermissions {
  roles: ResolverRoleName[]
  admin_roles: ResolverRoleName[]
  role_bitmap: Hex
}

export interface ResolverSummary {
  address: Address
  created_block: number
  created_at?: string | null
  updated_block?: number
  updated_at?: string | null
  record_count: number
}

export interface AccountResolver extends ResolverSummary, ResolverPermissions {
  manages_records?: boolean
  key_grants?: ResolverKeyPermission[]
}

export interface AccountResolvers {
  account: Address
  resolvers: AccountResolver[]
}

export interface ResolverAccount extends ResolverPermissions {
  account: Address
}

export interface ResolverKeyPermission extends ResolverPermissions {
  resource: Hex
  arg: Hex | null
  key?: string
  coin_type?: string
  content_type?: string
  interface_id?: string
}

export interface ResolverKeyGrant extends ResolverKeyPermission {
  account: Address
}

export interface ResolverDetails extends ResolverSummary {
  default_record_id: string | null
  unlinked_name_count?: number
  accounts: ResolverAccount[]
  key_grants: ResolverKeyGrant[]
}

// Keep the API's raw kind/key/value representation. `addr` is not our editor's `address` kind.
export interface ResolverRecord {
  kind: 'text' | 'addr' | 'contenthash' | 'data' | 'name' | 'abi' | 'interface'
  key: string
  value: string
  encoding?: 'utf8' | 'bytes' | 'address' | 'flag'
  decoded?: string | null
}

export interface RecordConfiguration {
  record_id: string
  is_default?: boolean
  // A preview of at most 100 names. Use the names endpoint for the complete list.
  names: string[]
  name_count: number
  linked_name_count?: number
  inherited_name_count?: number
  records: ResolverRecord[]
}

export interface ResolverRecords {
  resolver: Address
  record_count: number
  default_record_id: string | null
  limit: number
  offset: number
  records: RecordConfiguration[]
}

export interface RecordName {
  name: string
  linked: boolean
}

export interface RecordNames {
  resolver: Address
  record_id: string
  is_default: boolean
  total: number
  limit: number
  offset: number
  names: RecordName[]
}

export interface ENSNameDetails {
  name: string
  node: Hex
  registry: Address
  label: string | null
  labelhash: Hex | null
  token_id: string | null
  status: 'registered' | 'reserved' | 'unregistered'
  expiry: number | null
  resolver: Address | null
  subregistry: Address | null
  record_id: string | null
  linked_record_id?: string | null
  uses_default?: boolean
  records: ResolverRecord[]
  updated_block: number
}
