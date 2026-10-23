import type { Resolver, ResolverRole, ResolverAdminRole } from '@/types/ens'
import type { Address } from 'viem'
import { getAccountResolvers } from './client'

interface GetUserResolversParams {
  userAddress: Address
  signal?: AbortSignal
}

export const getUserResolvers = async ({ userAddress, signal }: GetUserResolversParams): Promise<Resolver[]> => {
  const result = await getAccountResolvers(userAddress, signal)

  return result.resolvers.map((resolver) => ({
    address: resolver.address,
    nameCount: null,
    isDefault: false,
    managesRecords: resolver.manages_records,
    keyGrants: resolver.key_grants,
    createdAt: resolver.created_at,
    updatedAt: resolver.updated_at,
    createdBlock: resolver.created_block,
    updatedBlock: resolver.updated_block,
    roles: [
      ...resolver.roles.map((role) => `ROLE_${role.toUpperCase()}` as ResolverRole),
      ...resolver.admin_roles.map((role) => `ROLE_${role.toUpperCase()}_ADMIN` as ResolverAdminRole),
    ],
  }))
}
