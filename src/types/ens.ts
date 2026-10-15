import { RESOLVER_ADMIN_ROLES, RESOLVER_ROLES } from '@/constants/ens/resolver'
import { Address } from 'viem'

export type ResolverRole = (typeof RESOLVER_ROLES)[number]

export type ResolverAdminRole = (typeof RESOLVER_ADMIN_ROLES)[number]

export type Resolver = {
  address: Address
  name?: string | null
  nameCount: number | null
  roles: (ResolverRole | ResolverAdminRole)[]
  isDefault: boolean
}
