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
}

export type SettingsResolver = Resolver & { deployedBy?: Address; delegated?: boolean }

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
  record_count: number
}

export interface AccountResolver extends ResolverSummary, ResolverPermissions {}

export interface AccountResolvers {
  account: Address
  resolvers: AccountResolver[]
}

export interface ResolverAccount extends ResolverPermissions {
  account: Address
}

export interface ResolverKeyGrant extends ResolverAccount {
  resource: Hex
  arg: Hex | null
  key?: string
  coin_type?: string
  content_type?: string
  interface_id?: string
}

export interface ResolverDetails extends ResolverSummary {
  default_record_id: string | null
  accounts: ResolverAccount[]
  key_grants: ResolverKeyGrant[]
}

// Keep the API's raw kind/key/value representation. `addr` is not our editor's `address` kind.
export interface ResolverRecord {
  kind: string
  key: string
  value: string
}

export interface RecordConfiguration {
  record_id: string
  // At most 100 explicit links; name_count contains the total. Inherited assignments are not included.
  names: string[]
  name_count: number
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

export interface IndexedENSName {
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
  records: ResolverRecord[]
  updated_block: number
}
